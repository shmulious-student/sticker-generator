import PhotosUI
import SwiftUI

struct GeneratorView: View {
    @ObservedObject var viewModel: GeneratorViewModel
    let activeProvider: ProviderID

    private let resultColumns = [GridItem(.adaptive(minimum: 110), spacing: 12)]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                facePicker
                if !viewModel.faceImages.isEmpty { faceThumbnails }
                promptField
                variationsStepper
                providerLabel
                generateButton

                if viewModel.isLoading {
                    ProgressView(viewModel.progressText)
                        .padding()
                }

                if !viewModel.stickers.isEmpty { results }
            }
            .padding()
        }
        .alert("Something went wrong", isPresented: errorBinding) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )
    }

    private var facePicker: some View {
        let count = viewModel.faceImages.count
        return PhotosPicker(selection: $viewModel.photoItems,
                            maxSelectionCount: 10,
                            matching: .images) {
            VStack(spacing: 8) {
                Image(systemName: "person.2.crop.square.stack")
                    .font(.largeTitle)
                Text(count == 0
                     ? "Add face photos"
                     : "\(count) selected — tap to change")
            }
            .foregroundStyle(.secondary)
            .frame(height: 120)
            .frame(maxWidth: .infinity)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 16))
        }
        .onChange(of: viewModel.photoItems) { _, items in
            Task { await viewModel.loadFaces(from: items) }
        }
    }

    private var faceThumbnails: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(viewModel.faceImages.enumerated()), id: \.offset) { _, image in
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 64, height: 64)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    private var promptField: some View {
        TextField("Describe the sticker style… e.g. cartoon astronaut",
                  text: $viewModel.prompt,
                  axis: .vertical)
            .textFieldStyle(.roundedBorder)
            .lineLimit(2...4)
    }

    private var variationsStepper: some View {
        Stepper(value: $viewModel.variationsPerFace, in: 1...6) {
            Text("Stickers per face: \(viewModel.variationsPerFace)")
                .font(.subheadline)
        }
    }

    private var providerLabel: some View {
        HStack(spacing: 6) {
            Image(systemName: "cpu")
            Text("Provider: \(activeProvider.displayName)")
            Spacer()
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
    }

    private var generateButton: some View {
        Button {
            Task { await viewModel.generate(using: activeProvider) }
        } label: {
            Text("Generate Stickers")
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
        .disabled(!viewModel.canGenerate)
    }

    private var results: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Stickers")
                    .font(.headline)
                Spacer()
                if viewModel.failureCount > 0 {
                    Text("\(viewModel.failureCount) failed")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            LazyVGrid(columns: resultColumns, spacing: 12) {
                ForEach(viewModel.stickers) { item in
                    if let image = item.uiImage {
                        StickerCell(image: image)
                    }
                }
            }
        }
    }
}
