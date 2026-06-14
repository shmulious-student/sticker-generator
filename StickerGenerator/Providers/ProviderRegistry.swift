import Foundation

/// Holds every provider and resolves the active one by id. Adding a provider is a
/// one-line change here; nothing in the UI needs to know about it.
final class ProviderRegistry {
    static let shared = ProviderRegistry()

    private let providers: [ProviderID: ImageProvider]

    init(providers: [ImageProvider] = [GeminiProvider(), HuggingFaceProvider(), ReplicateProvider()]) {
        var map: [ProviderID: ImageProvider] = [:]
        for provider in providers { map[provider.id] = provider }
        self.providers = map
    }

    func provider(for id: ProviderID) -> ImageProvider {
        providers[id] ?? GeminiProvider()
    }
}
