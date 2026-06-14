import Foundation

/// One error type surfaced to the UI for friendly messages.
enum APIError: LocalizedError {
    case missingAPIKey(ProviderID)
    case invalidURL
    case network(Error)
    case http(status: Int, body: String)
    case decoding(String)
    case noImageReturned
    case rateLimited
    case providerError(String)
    case timedOut

    var errorDescription: String? {
        switch self {
        case .missingAPIKey(let provider):
            return "No API key set for \(provider.displayName). Add it to Config/Secrets.xcconfig."
        case .invalidURL:
            return "Invalid request URL."
        case .network(let error):
            return "Network error: \(error.localizedDescription)"
        case .http(let status, let body):
            return "Server error (\(status)). \(body.prefix(200))"
        case .decoding(let message):
            return "Couldn't read the response: \(message)"
        case .noImageReturned:
            return "The provider didn't return an image."
        case .rateLimited:
            return "Rate limit reached. Wait a moment and try again."
        case .providerError(let message):
            return message
        case .timedOut:
            return "The request timed out."
        }
    }
}
