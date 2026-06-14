import Foundation

/// Reads API keys injected from Config/Secrets.xcconfig via Info.plist substitution.
///
/// This is the single seam for credentials. To move to a backend key-proxy later,
/// only this type (and the provider base URLs) need to change.
struct SecretsStore {
    static let shared = SecretsStore()

    func key(for provider: ProviderID) -> String? {
        let infoKey: String
        switch provider {
        case .gemini: infoKey = "GeminiAPIKey"
        case .huggingFace: infoKey = "HuggingFaceAPIKey"
        case .replicate: infoKey = "ReplicateAPIKey"
        }
        guard let value = Bundle.main.object(forInfoDictionaryKey: infoKey) as? String else {
            return nil
        }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
