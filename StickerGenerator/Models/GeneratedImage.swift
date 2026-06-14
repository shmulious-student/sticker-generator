import Foundation

/// The result returned by any provider.
struct GeneratedImage: Identifiable, Sendable {
    let id = UUID()
    let imageData: Data
    let provider: ProviderID
    let mimeType: String
}
