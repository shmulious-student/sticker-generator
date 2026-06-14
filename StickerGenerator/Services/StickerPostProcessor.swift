import UIKit

/// Post-processes a raw generated image into a sticker: square canvas, aspect-fit,
/// transparent padding, PNG-encoded.
enum StickerPostProcessor {
    static func normalize(_ data: Data, to side: CGFloat) -> Data? {
        guard let image = UIImage(data: data) else { return nil }

        let canvas = CGSize(width: side, height: side)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = false

        let rendered = UIGraphicsImageRenderer(size: canvas, format: format).image { _ in
            let scale = min(side / image.size.width, side / image.size.height)
            let width = image.size.width * scale
            let height = image.size.height * scale
            let origin = CGPoint(x: (side - width) / 2, y: (side - height) / 2)
            image.draw(in: CGRect(origin: origin, size: CGSize(width: width, height: height)))
        }
        return rendered.pngData()
    }
}
