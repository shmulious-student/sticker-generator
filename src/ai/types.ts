/**
 * AI sticker generation: turning a cropped face + a prompt into a styled image.
 *
 * This is the "Phase 6" backend the README reserves. Providers are plain `fetch`
 * clients (no React Native imports) so they're unit-testable in Node; the
 * RN/file-IO glue lives in AIGenerator.
 */

export type AIProviderId = 'gemini' | 'replicate';

export interface AIGenerateInput {
  /** Base64-encoded face image (no data: prefix). */
  faceBase64: string;
  /** MIME type of the face image, e.g. 'image/png'. */
  faceMime: string;
  /** The fully-built prompt (already styled — see prompt.ts). */
  prompt: string;
}

/** A provider either returns inline base64 (Gemini) or a URL to fetch (Replicate). */
export type AIImageResult =
  | {kind: 'base64'; data: string; mime: string}
  | {kind: 'url'; url: string};

export interface AIProvider {
  readonly id: AIProviderId;
  generate(input: AIGenerateInput): Promise<AIImageResult>;
}

/** Persisted AI configuration (see storage/settings.ts). */
export interface AIConfig {
  enabled: boolean;
  provider: AIProviderId;
  /** Default prompt; can be overridden per pack. */
  prompt: string;
  geminiApiKey?: string;
  replicateApiKey?: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  provider: 'gemini',
  prompt: '',
};

/** Errors surfaced from the AI layer with user-readable messages. */
export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}
