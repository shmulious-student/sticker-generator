# Sticker Generator

Turn the faces in your portrait photos into **WhatsApp** and **Telegram** sticker
packs — fully **on-device**, no servers, no uploads.

You pick a collection of photos, the app detects every face, cuts each one out
with a transparent background, normalizes it to a 512×512 WebP sticker, and lets
you import the pack into WhatsApp and/or Telegram.

## How it works

```
photos → face detection (ML Kit) → square crop (padded)
       → background removal (Vision / ML Kit Subject Segmentation)
       → 512×512 WebP (≤100KB)  → pack → WhatsApp / Telegram
```

Everything runs locally on the phone. The MVP needs no backend.

## Tech stack

- **React Native + TypeScript** (bare workflow — native modules required, so **not** Expo Go).
- **Face detection:** `@react-native-ml-kit/face-detection` (Google ML Kit, on-device).
- **Background removal:** `@six33/react-native-bg-removal` (iOS 17+ Vision
  `VNGenerateForegroundInstanceMaskRequest`; Android ML Kit Subject Segmentation).
  On iOS < 17 we fall back to ML Kit Selfie Segmentation — still on-device.
- **Photo picking:** `react-native-image-picker` (multi-select).
- **Storage:** `react-native-fs` for assets, AsyncStorage for metadata.
- **Navigation:** React Navigation (native-stack).

## Project layout

```
src/
  types/                Domain types (Rect, DetectedFace, StickerPack, …)
  pipeline/
    geometry.ts         Pure crop/canvas math (unit-tested)
    faceDetection.ts    ML Kit face detection wrapper
    backgroundRemoval.ts On-device bg removal wrapper
    CutoutGenerator.ts  StickerGenerator seam (AI impl plugs in later)
    stickerPipeline.ts  Orchestrator: detect → crop → generate → tray
  native/
    WebPEncoder.ts      JS binding: crop + 512 composite + WebP encode + tray
    TelegramImport.ts   JS binding: Telegram import bridge
    imageInfo.ts        Image.getSize helper (no native module)
  storage/
    packStore.ts        Pack persistence (AsyncStorage + RNFS)
    settings.ts         App settings
  export/
    validation.ts       Pure WhatsApp/Telegram limit checks (unit-tested)
    whatsapp.ts         Add-to-WhatsApp flow
    telegram.ts         Import-to-Telegram flow
  screens/              Home, SelectPhotos, Generating, Review, PackDetail, Settings
```

## Native modules to implement

Two custom native modules back the JS bindings in `src/native/` (no maintained
RN package exists for them):

1. **`WebPEncoder`** — crop a rect from a source image, composite the (transparent)
   cutout onto a 512×512 transparent canvas ("contain" fit), and encode to WebP
   while auto-tuning quality to stay ≤100KB. Also emits a 96×96 PNG tray icon.
   - Android: `Bitmap.compress(Bitmap.CompressFormat.WEBP_LOSSY, q, …)`.
   - iOS: `libwebp` / `SDWebImageWebPCoder`.
2. **`TelegramImport`** — wrap the official
   [TelegramStickersImport](https://core.telegram.org/import-stickers) libs.
   - Android: `Intent("org.telegram.messenger.CREATE_STICKER_PACK")` with
     `EXTRA_STREAM` URIs + `STICKER_EMOJIS`.
   - iOS: pasteboard handoff + `tg://importStickers`.

### Platform config checklist

- **Android** `app/build.gradle`: `aaptOptions { noCompress "webp" }`;
  manifest `<queries>` for the WhatsApp + Telegram packages.
- **iOS** `Info.plist`: photo-library usage string;
  `LSApplicationQueriesSchemes` = `whatsapp`, `tg`.

## Sticker constraints (enforced in `src/export/validation.ts`)

| | WhatsApp | Telegram |
|---|---|---|
| Image | 512×512 WebP, transparent, ≤100KB | 512×512 WebP |
| Count | 3–30 | 1–120 (each import = new set) |
| Tray icon | 96×96 PNG ≤50KB | n/a |
| Emoji | required per sticker | required per sticker |

## Getting started

> The `android/` and `ios/` native projects are generated locally and are not
> committed. Generate them on top of this source, then run pod/gradle install.

```bash
npm install
# Generate native projects (RN CLI) if not present, then:
npx pod-install            # iOS
npm run android            # or: npm run ios
```

## Quality checks

```bash
npm test         # Jest unit tests for the pure pipeline/validation logic
npm run typecheck
npm run lint
```

## Roadmap

- **Phase 1** — photo pick + face detection + crop preview ✅ (wired)
- **Phase 2** — background removal + WebP/512 normalization (native module)
- **Phase 3** — pack management & persistence ✅ (wired)
- **Phase 4** — WhatsApp export ✅ (wired; needs native build)
- **Phase 5** — Telegram export (native bridge)
- **Phase 6 (later)** — AI-stylized stickers via an `AIGenerator` implementing the
  same `StickerGenerator` interface (introduces the only backend).
