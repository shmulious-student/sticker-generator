/**
 * Replicate (zsxkib/instant-id): identity-preserving generation. Create a
 * prediction, poll until it succeeds, then return the output image URL.
 * Uses the version-less model endpoint so there's no hash to maintain.
 */

import {AIError} from '../types';
import type {AIGenerateInput, AIImageResult, AIProvider} from '../types';

const MODEL_OWNER = 'zsxkib';
const MODEL_NAME = 'instant-id';

/** Replicate models return either a single URL string or an array of URLs. */
export function firstOutputUrl(output: unknown): string | null {
  if (typeof output === 'string') {
    return output;
  }
  if (Array.isArray(output) && typeof output[0] === 'string') {
    return output[0];
  }
  return null;
}

export interface ReplicateOptions {
  maxPolls?: number;
  pollIntervalMs?: number;
}

export class ReplicateProvider implements AIProvider {
  readonly id = 'replicate' as const;

  constructor(private apiKey: string, private options: ReplicateOptions = {}) {}

  async generate(input: AIGenerateInput): Promise<AIImageResult> {
    if (!this.apiKey) {
      throw new AIError('No Replicate API key set.');
    }

    const dataUri = `data:${input.faceMime};base64,${input.faceBase64}`;
    const createRes = await fetch(
      `https://api.replicate.com/v1/models/${MODEL_OWNER}/${MODEL_NAME}/predictions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({input: {prompt: input.prompt, image: dataUri}}),
      },
    );

    if (createRes.status === 429) {
      throw new AIError('Replicate rate limit reached. Try again shortly.');
    }
    if (!createRes.ok) {
      throw new AIError(`Replicate error ${createRes.status}: ${await createRes.text()}`);
    }

    const created = await createRes.json();
    const getUrl: string | undefined = created?.urls?.get;
    if (!getUrl) {
      throw new AIError('Replicate: missing prediction polling URL.');
    }

    const maxPolls = this.options.maxPolls ?? 60;
    const pollIntervalMs = this.options.pollIntervalMs ?? 2000;

    for (let i = 0; i < maxPolls; i++) {
      const pollRes = await fetch(getUrl, {
        headers: {Authorization: `Token ${this.apiKey}`},
      });
      const pred = await pollRes.json();

      switch (pred?.status) {
        case 'succeeded': {
          const out = firstOutputUrl(pred.output);
          if (!out) {
            throw new AIError('Replicate returned no output image.');
          }
          return {kind: 'url', url: out};
        }
        case 'failed':
        case 'canceled':
          throw new AIError(
            pred.error ? String(pred.error) : `Replicate prediction ${pred.status}.`,
          );
        default:
          await delay(pollIntervalMs);
      }
    }

    throw new AIError('Replicate prediction timed out.');
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
