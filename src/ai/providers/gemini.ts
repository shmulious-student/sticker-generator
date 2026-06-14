/**
 * Gemini 2.5 Flash Image ("Nano Banana"): a single synchronous call that takes
 * prompt + face and returns an image inline as base64. Free tier, no polling.
 */

import {AIError} from '../types';
import type {AIGenerateInput, AIImageResult, AIProvider} from '../types';

const MODEL = 'gemini-2.5-flash-image';

/** Extracts the first inline image part. Accepts camelCase and snake_case keys. */
export function parseGeminiImage(json: any): {data: string; mime: string} {
  const parts = json?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      const inline = part?.inlineData ?? part?.inline_data;
      if (inline?.data) {
        return {
          data: inline.data as string,
          mime: (inline.mimeType ?? inline.mime_type ?? 'image/png') as string,
        };
      }
    }
  }
  throw new AIError('Gemini returned no image.');
}

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini' as const;

  constructor(private apiKey: string) {}

  async generate(input: AIGenerateInput): Promise<AIImageResult> {
    if (!this.apiKey) {
      throw new AIError('No Gemini API key set.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [
        {
          parts: [
            {text: input.prompt},
            {inline_data: {mime_type: input.faceMime, data: input.faceBase64}},
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      throw new AIError('Gemini rate limit reached. Try again shortly.');
    }
    if (!res.ok) {
      throw new AIError(`Gemini error ${res.status}: ${await res.text()}`);
    }

    const {data, mime} = parseGeminiImage(await res.json());
    return {kind: 'base64', data, mime};
  }
}
