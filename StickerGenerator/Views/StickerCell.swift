import SwiftUI

/// One sticker in the results grid with its own save/share affordances.
struct StickerCell: View {
    let image: UIImage

    var body: some View {
        VStack(spacing: 6) {
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity)
                .background(.quaternary, in: RoundedRectangle(cornerRadius: 12))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            HStack(spacing: 16) {
                Button {
                    UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
                } label: {
                    Image(systemName: "square.and.arrow.down")
                }

                ShareLink(
                    item: Image(uiImage: image),
                    preview: SharePreview("Sticker", image: Image(uiImage: image))
                ) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
            .font(.subheadline)
            .buttonStyle(.borderless)
        }
    }
}
