import Foundation

/// The batch entry point: takes a set of face photos + one prompt and produces a set
/// of AI-generated stickers, fanning out across the active provider with bounded
/// concurrency. Reuses `ImageGenerationService` (and therefore the provider pattern)
/// for each individual generation.
struct StickerService {
    private let generation: ImageGenerationService

    init(generation: ImageGenerationService = ImageGenerationService()) {
        self.generation = generation
    }

    enum Event: Sendable {
        case progress(completed: Int, total: Int)
        case finished(StickerSet)
    }

    /// Streams progress as each sticker finishes, then a final `.finished` event.
    func generateStickerSet(faces: [Data],
                            prompt: String,
                            provider providerID: ProviderID,
                            options: StickerStyleOptions = .default) -> AsyncStream<Event> {
        AsyncStream { continuation in
            let task = Task {
                // Build the work list: one job per (face, variation).
                var jobs: [(face: Int, variation: Int)] = []
                for faceIndex in faces.indices {
                    for variation in 0..<max(1, options.variationsPerFace) {
                        jobs.append((faceIndex, variation))
                    }
                }

                let total = jobs.count
                continuation.yield(.progress(completed: 0, total: total))

                var results: [StickerSetItem] = []
                var completed = 0

                await withTaskGroup(of: StickerSetItem.self) { group in
                    var iterator = jobs.makeIterator()
                    var active = 0

                    func addNext() {
                        guard let job = iterator.next() else { return }
                        let faceData = faces[job.face]
                        group.addTask {
                            await generateOne(faceData: faceData,
                                              basePrompt: prompt,
                                              providerID: providerID,
                                              faceIndex: job.face,
                                              variationIndex: job.variation,
                                              options: options)
                        }
                        active += 1
                    }

                    for _ in 0..<min(options.maxConcurrent, max(jobs.count, 1)) { addNext() }

                    while active > 0, let item = await group.next() {
                        active -= 1
                        results.append(item)
                        completed += 1
                        continuation.yield(.progress(completed: completed, total: total))
                        addNext()
                    }
                }

                let ordered = results.sorted {
                    ($0.sourceFaceIndex, $0.variationIndex) < ($1.sourceFaceIndex, $1.variationIndex)
                }
                continuation.yield(.finished(StickerSet(items: ordered)))
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    private func generateOne(faceData: Data,
                             basePrompt: String,
                             providerID: ProviderID,
                             faceIndex: Int,
                             variationIndex: Int,
                             options: StickerStyleOptions) async -> StickerSetItem {
        do {
            let prompt = Self.prompt(base: basePrompt,
                                     variationIndex: variationIndex,
                                     options: options)
            var generated = try await generation.generate(prompt: prompt,
                                                           faceImage: faceData,
                                                           using: providerID)
            if let side = options.outputSize,
               let normalized = StickerPostProcessor.normalize(generated.imageData, to: side) {
                generated = GeneratedImage(imageData: normalized,
                                           provider: generated.provider,
                                           mimeType: "image/png")
            }
            return StickerSetItem(sourceFaceIndex: faceIndex,
                                  variationIndex: variationIndex,
                                  image: generated,
                                  errorMessage: nil)
        } catch let error as APIError {
            return StickerSetItem(sourceFaceIndex: faceIndex,
                                  variationIndex: variationIndex,
                                  image: nil,
                                  errorMessage: error.errorDescription)
        } catch {
            return StickerSetItem(sourceFaceIndex: faceIndex,
                                  variationIndex: variationIndex,
                                  image: nil,
                                  errorMessage: error.localizedDescription)
        }
    }

    /// Distinct expressions/poses cycled through when generating multiple stickers per face,
    /// so a pack reads as a varied set rather than near-duplicates.
    static let expressionVariations = [
        "with a big happy smile",
        "with a surprised, wide-eyed expression",
        "giving a playful wink and a thumbs up",
        "laughing out loud",
        "with a cool, confident look and sunglasses",
        "blowing a kiss with a heart",
    ]

    /// Builds the final prompt for one job: base prompt + (optional) per-variation expression
    /// + (optional) die-cut sticker styling.
    static func prompt(base: String, variationIndex: Int, options: StickerStyleOptions) -> String {
        var subject = base
        if options.variationsPerFace > 1 {
            let expression = expressionVariations[variationIndex % expressionVariations.count]
            subject += ", \(expression)"
        }
        guard options.applyStickerPromptStyling else { return subject }
        return "\(subject). Render as a cute die-cut sticker: bold clean outline, vibrant colors, "
            + "simple plain background, subject centered, and preserve the person's facial likeness."
    }
}
