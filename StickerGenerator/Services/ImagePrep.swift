import UIKit

/// Normalizes a picked photo before sending: downscale to a sane max dimension and
/// JPEG-encode. Keeps payloads small and consistent across providers.
enum ImagePrep {
    static func jpegData(from image: UIImage,
                         maxDimension: CGFloat = 1024,
                         quality: CGFloat = 0.9) -> Data? {
        resize(image, maxDimension: maxDimension).jpegData(compressionQuality: quality)
    }

    static func resize(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let largestSide = max(image.size.width, image.size.height)
        guard largestSide > maxDimension else { return image }

        let scale = maxDimension / largestSide
        let newSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}
