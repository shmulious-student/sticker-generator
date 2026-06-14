import Foundation

/// Replicate: create a prediction, then poll until it succeeds and download the output.
/// All of that is hidden behind the single `generate` call.
struct ReplicateProvider: ImageProvider {
    let id: ProviderID = .replicate

    private let http: HTTPClient
    private let secrets: SecretsStore

    /// Identity-preserving model. Inputs: `image` (face) + `prompt`.
    /// Using the version-less model endpoint so there's no hash to keep in sync.
    private let modelOwner = "zsxkib"
    private let modelName = "instant-id"

    private let maxPolls = 60
    private let pollInterval: UInt64 = 2_000_000_000 // 2s

    init(http: HTTPClient = HTTPClient(), secrets: SecretsStore = .shared) {
        self.http = http
        self.secrets = secrets
    }

    func generate(_ request: GenerationRequest) async throws -> GeneratedImage {
        guard let key = secrets.key(for: id) else { throw APIError.missingAPIKey(id) }

        let dataURI = "data:image/jpeg;base64,\(request.faceImage.base64EncodedString())"
        let body: [String: Any] = [
            "input": ["prompt": request.prompt, "image": dataURI],
        ]

        let endpoint = "https://api.replicate.com/v1/models/\(modelOwner)/\(modelName)/predictions"
        var create = URLRequest(url: URL(string: endpoint)!)
        create.httpMethod = "POST"
        create.setValue("Token \(key)", forHTTPHeaderField: "Authorization")
        create.setValue("application/json", forHTTPHeaderField: "Content-Type")
        create.httpBody = try JSONSerialization.data(withJSONObject: body)

        let created = try await http.send(create)
        guard created.status == 200 || created.status == 201 else {
            if created.status == 429 { throw APIError.rateLimited }
            throw APIError.http(status: created.status,
                                body: String(data: created.data, encoding: .utf8) ?? "")
        }

        guard let json = try JSONSerialization.jsonObject(with: created.data) as? [String: Any],
              let getURLString = (json["urls"] as? [String: Any])?["get"] as? String,
              let getURL = URL(string: getURLString)
        else {
            throw APIError.decoding("Missing prediction polling URL")
        }

        return try await poll(getURL, key: key)
    }

    private func poll(_ url: URL, key: String) async throws -> GeneratedImage {
        for _ in 0..<maxPolls {
            var request = URLRequest(url: url)
            request.setValue("Token \(key)", forHTTPHeaderField: "Authorization")
            let response = try await http.send(request)

            guard let json = try JSONSerialization.jsonObject(with: response.data) as? [String: Any],
                  let status = json["status"] as? String
            else {
                throw APIError.decoding("Unexpected prediction response")
            }

            switch status {
            case "succeeded":
                guard let imageURL = Self.firstOutputURL(json["output"]) else {
                    throw APIError.noImageReturned
                }
                return try await download(imageURL)
            case "failed", "canceled":
                throw APIError.providerError((json["error"] as? String) ?? "Prediction \(status)")
            default:
                try await Task.sleep(nanoseconds: pollInterval)
            }
        }
        throw APIError.timedOut
    }

    private func download(_ url: URL) async throws -> GeneratedImage {
        let response = try await http.send(URLRequest(url: url))
        guard response.status == 200 else {
            throw APIError.http(status: response.status, body: "Image download failed")
        }
        return GeneratedImage(imageData: response.data, provider: id, mimeType: "image/png")
    }

    /// Replicate models return either a single URL string or an array of URLs.
    static func firstOutputURL(_ output: Any?) -> URL? {
        if let string = output as? String { return URL(string: string) }
        if let array = output as? [String], let first = array.first { return URL(string: first) }
        return nil
    }
}
