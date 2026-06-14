/**
 * Public entry point for the AI sticker layer.
 *
 * `createAIGenerator` is the one function the app calls: given persisted config and
 * an optional per-pack prompt, it returns an AIGenerator ready to drop into
 * runPipeline — or null when AI is disabled (so the caller falls back to the
 * on-device CutoutGenerator).
 */

import {AIGenerator} from './AIGenerator';
import {buildStickerPrompt} from './prompt';
import {GeminiProvider} from './providers/gemini';
import {ReplicateProvider} from './providers/replicate';
import type {AIConfig, AIProvider} from './types';

export * from './types';
export {buildStickerPrompt, EXPRESSION_VARIATIONS} from './prompt';
export {AIGenerator} from './AIGenerator';
export {GeminiProvider} from './providers/gemini';
export {ReplicateProvider} from './providers/replicate';

export function createProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'replicate':
      return new ReplicateProvider(config.replicateApiKey ?? '');
    case 'gemini':
    default:
      return new GeminiProvider(config.geminiApiKey ?? '');
  }
}

/** Returns a configured AIGenerator, or null when AI is disabled. */
export function createAIGenerator(
  config: AIConfig,
  promptOverride?: string,
): AIGenerator | null {
  if (!config.enabled) {
    return null;
  }
  const base = (promptOverride?.trim() || config.prompt || '').trim();
  return new AIGenerator({
    provider: createProvider(config),
    prompt: buildStickerPrompt(base),
  });
}
