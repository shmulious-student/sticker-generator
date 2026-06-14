import PhotosUI
import SwiftUI

@MainActor
final class GeneratorViewModel: ObservableObject {
    @Published var prompt: String = ""
    @Published var variationsPerFace: Int = 1
    @Published var photoItems: [PhotosPickerItem] = []
    @Published var faceImages: [UIImage] = []
    @Published var faceData: [Data] = []

    @Published var isLoading = false
    @Published var completed = 0
    @Published var total = 0

    @Published var stickers: [StickerSetItem] = []
    @Published var failureCount = 0
    @Published var errorMessage: String?

    private let service: StickerService

    init(service: StickerService = StickerService()) {
        self.service = service
    }

    var canGenerate: Bool {
        !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !faceData.isEmpty
            && !isLoading
    }

    var progressText: String {
        total > 0 ? "Generating \(completed)/\(total)…" : "Generating…"
    }

    func loadFaces(from items: [PhotosPickerItem]) async {
        var images: [UIImage] = []
        var datas: [Data] = []
        for item in items {
            guard let data = try? await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: data) else { continue }
            images.append(image)
            if let jpeg = ImagePrep.jpegData(from: image) { datas.append(jpeg) }
        }
        faceImages = images
        faceData = datas
    }

    func generate(using providerID: ProviderID) async {
        guard !faceData.isEmpty else { return }
        isLoading = true
        errorMessage = nil
        stickers = []
        failureCount = 0
        completed = 0
        total = 0

        let options = StickerStyleOptions(variationsPerFace: variationsPerFace)
        let stream = service.generateStickerSet(faces: faceData,
                                                 prompt: prompt,
                                                 provider: providerID,
                                                 options: options)
        for await event in stream {
            switch event {
            case .progress(let done, let totalCount):
                completed = done
                total = totalCount
            case .finished(let set):
                stickers = set.stickers
                failureCount = set.failures.count
                if set.stickers.isEmpty {
                    errorMessage = set.failures.first?.errorMessage ?? "No stickers were generated."
                }
            }
        }

        isLoading = false
    }
}
