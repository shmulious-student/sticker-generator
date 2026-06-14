import Foundation

/// Hugging Face Inference: open-source identity-preserving models. Retries on HTTP 503
/// (model loading / cold start) before giving up.
struct HuggingFaceProvider: ImageProvider {
    let id: ProviderID = .huggingFace

    private let http: HTTPClient
    private let secrets: SecretsStore

    /// Point this at an InstantID / PhotoMaker-capable Inference endpoint or Space API.
    private let endpoint = "https://api-inference.huggingface.co/models/REPLACE_WITH_HF_MODEL"

    private let maxColdStartRetries = 5
    private let coldStartDelay: UInt64 = 3_000_000_000 // 3s

    init(http: HTTPClient = HTTPClient(), secrets: SecretsStore = .shared) {
        self.http = http
        self.secrets = secrets
    }

    func generate(_ request: GenerationRequest) async throws -> GeneratedImage {
        guard let key = secrets.key(for: id) else { throw APIError.missingAPIKey(id) }
        guard let url = URL(string: endpoint) else { throw APIError.invalidURL }

        let body: [String: Any] = [
            "inputs": request.prompt,
            "parameters": ["image": request.faceImage.base64EncodedString()],
            "options": ["wait_for_model": true],
        ]
        let payload = try JSONSerialization.data(withJSONObject: body)

        var attempt = 0
        while true {
            var urlRequest = URLRequest(url: url)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = payload

            let response = try await http.send(urlRequest)
            switch response.status {
            case 200:
                // HF image models typically return the raw image bytes.
                return GeneratedImage(imageData: response.data, provider: id, mimeType: "image/png")
            case 503 where attempt < maxColdStartRetries:
                attempt += 1
                try await Task.sleep(nanoseconds: coldStartDelay)
                continue
            case 429:
                throw APIError.rateLimited
            default:
                throw APIError.http(status: response.status,
                                    body: String(data: response.data, encoding: .utf8) ?? "")
            }
        }
    }
}
