import Foundation

/// Identifies an image-generation backend. Adding a new provider starts here.
enum ProviderID: String, CaseIterable, Identifiable, Codable {
    case gemini
    case huggingFace
    case replicate

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .gemini: return "Gemini 2.5 Flash Image"
        case .huggingFace: return "Hugging Face (InstantID)"
        case .replicate: return "Replicate (Flux Kontext)"
        }
    }

    /// Short note shown in the picker to set expectations.
    var blurb: String {
        switch self {
        case .gemini: return "Free tier · fast · single call"
        case .huggingFace: return "Not configured yet · see README"
        case .replicate: return "Best quality · pay-per-use"
        }
    }
}
