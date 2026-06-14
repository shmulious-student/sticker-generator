import Foundation

/// The abstraction the whole app talks to. Each backend implements this and hides
/// its own request shape, auth, and (where needed) polling behind one async call.
protocol ImageProvider {
    var id: ProviderID { get }
    var displayName: String { get }
    func generate(_ request: GenerationRequest) async throws -> GeneratedImage
}

extension ImageProvider {
    var displayName: String { id.displayName }
}
