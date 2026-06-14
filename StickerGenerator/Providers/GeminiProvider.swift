import Foundation

/// Default provider. Gemini 2.5 Flash Image ("Nano Banana"): a single synchronous
/// REST call that takes prompt + face photo and returns an image inline.
struct GeminiProvider: ImageProvider {
    let id: ProviderID = .gemini

    private let http: HTTPClient
    private let secrets: SecretsStore
    private let model = "gemini-2.5-flash-image"

    init(http: HTTPClient = HTTPClient(), secrets: SecretsStore = .shared) {
        self.http = http
        self.secrets = secrets
    }

    func generate(_ request: GenerationRequest) async throws -> GeneratedImage {
        guard let key = secrets.key(for: id) else { throw APIError.missingAPIKey(id) }
        guard let url = URL(string:
            "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent?key=\(key)"
        ) else {
            throw APIError.invalidURL
        }

        let base64Face = request.faceImage.base64EncodedString()
        let body: [String: Any] = [
            "contents": [[
                "parts": [
                    ["text": request.prompt],
                    ["inline_data": ["mime_type": "image/jpeg", "data": base64Face]],
                ],
            ]],
        ]

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try JSONSerialization.data(withJSONObject: body)

        let response = try await http.send(urlRequest)
        guard response.status == 200 else {
            if response.status == 429 { throw APIError.rateLimited }
            throw APIError.http(status: response.status,
                                body: String(data: response.data, encoding: .utf8) ?? "")
        }

        return try Self.parseImage(from: response.data, provider: id)
    }

    /// Extracts the first inline image part. Accepts both camelCase and snake_case keys
    /// since the API has shipped both over time.
    static func parseImage(from data: Data, provider: ProviderID) throws -> GeneratedImage {
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let content = candidates.first?["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]]
        else {
            throw APIError.decoding("Unexpected Gemini response shape")
        }

        for part in parts {
            guard let inline = (part["inlineData"] ?? part["inline_data"]) as? [String: Any],
                  let base64 = inline["data"] as? String,
                  let imageData = Data(base64Encoded: base64)
            else { continue }
            let mime = (inline["mimeType"] ?? inline["mime_type"]) as? String ?? "image/png"
            return GeneratedImage(imageData: imageData, provider: provider, mimeType: mime)
        }
        throw APIError.noImageReturned
    }
}
