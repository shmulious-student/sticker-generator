import Foundation

/// The one entry point the UI calls. Builds a request and forwards it to the active provider.
struct ImageGenerationService {
    let registry: ProviderRegistry

    init(registry: ProviderRegistry = .shared) {
        self.registry = registry
    }

    func generate(prompt: String, faceImage: Data, using providerID: ProviderID) async throws -> GeneratedImage {
        let request = GenerationRequest(prompt: prompt, faceImage: faceImage)
        return try await registry.provider(for: providerID).generate(request)
    }
}
