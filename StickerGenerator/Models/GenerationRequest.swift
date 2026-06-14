import CoreGraphics
import Foundation

/// Tunables shared across providers when preparing/generating an image.
struct GenerationOptions {
    var maxImageDimension: CGFloat = 1024
    var jpegQuality: CGFloat = 0.9

    static let `default` = GenerationOptions()
}

/// A provider-agnostic request: a text prompt plus a JPEG-encoded face photo.
struct GenerationRequest {
    let prompt: String
    let faceImage: Data
    var options: GenerationOptions = .default
}
