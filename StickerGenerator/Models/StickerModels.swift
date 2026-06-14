import UIKit

/// Tunables for turning a set of faces into a set of stickers.
struct StickerStyleOptions: Sendable {
    /// Augment the prompt with die-cut sticker styling guidance.
    var applyStickerPromptStyling = true
    /// Square-normalize each result to this side length (points). nil = leave as returned.
    var outputSize: CGFloat? = 512
    /// How many sticker variations to generate per input face.
    var variationsPerFace = 1
    /// Upper bound on concurrent provider calls (providers rate-limit).
    var maxConcurrent = 3

    static let `default` = StickerStyleOptions()
}

/// One produced sticker (or a per-item failure) tied back to its source face.
struct StickerSetItem: Identifiable, Sendable {
    let id = UUID()
    let sourceFaceIndex: Int
    let variationIndex: Int
    let image: GeneratedImage?
    let errorMessage: String?

    var uiImage: UIImage? {
        guard let data = image?.imageData else { return nil }
        return UIImage(data: data)
    }
}

/// The full result of a batch run.
struct StickerSet: Sendable {
    let items: [StickerSetItem]

    var stickers: [StickerSetItem] { items.filter { $0.image != nil } }
    var failures: [StickerSetItem] { items.filter { $0.image == nil } }
}
