import {GeminiProvider, parseGeminiImage} from '../providers/gemini';
import {ReplicateProvider, firstOutputUrl} from '../providers/replicate';
import {AIError} from '../types';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const input = {faceBase64: 'AAAA', faceMime: 'image/png', prompt: 'a cat'};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('parseGeminiImage', () => {
  it('reads inlineData (camelCase)', () => {
    const out = parseGeminiImage({
      candidates: [{content: {parts: [{inlineData: {data: 'XYZ', mimeType: 'image/png'}}]}}],
    });
    expect(out).toEqual({data: 'XYZ', mime: 'image/png'});
  });

  it('reads inline_data (snake_case)', () => {
    const out = parseGeminiImage({
      candidates: [{content: {parts: [{inline_data: {data: 'XYZ'}}]}}],
    });
    expect(out.data).toBe('XYZ');
  });

  it('throws when no image part exists', () => {
    expect(() => parseGeminiImage({candidates: [{content: {parts: [{text: 'hi'}]}}]})).toThrow(
      AIError,
    );
  });
});

describe('GeminiProvider', () => {
  it('returns base64 image data on success', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        jsonResponse({
          candidates: [{content: {parts: [{inlineData: {data: 'IMG', mimeType: 'image/png'}}]}}],
        }),
      );

    const result = await new GeminiProvider('key').generate(input);

    expect(result).toEqual({kind: 'base64', data: 'IMG', mime: 'image/png'});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('gemini-2.5-flash-image:generateContent');
    expect(String(url)).toContain('key=key');
    expect(init?.method).toBe('POST');
  });

  it('throws without an API key', async () => {
    await expect(new GeminiProvider('').generate(input)).rejects.toThrow(AIError);
  });

  it('maps 429 to a rate-limit error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, 429));
    await expect(new GeminiProvider('key').generate(input)).rejects.toThrow(/rate limit/i);
  });
});

describe('firstOutputUrl', () => {
  it('handles a string', () => {
    expect(firstOutputUrl('http://x/y.png')).toBe('http://x/y.png');
  });
  it('handles an array', () => {
    expect(firstOutputUrl(['http://x/a.png', 'http://x/b.png'])).toBe('http://x/a.png');
  });
  it('returns null otherwise', () => {
    expect(firstOutputUrl(null)).toBeNull();
    expect(firstOutputUrl(42)).toBeNull();
  });
});

describe('ReplicateProvider', () => {
  it('creates a prediction then polls to the output URL', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse({urls: {get: 'https://api/poll/1'}}, 201))
      .mockResolvedValueOnce(
        jsonResponse({status: 'succeeded', output: ['https://cdn/out.png']}),
      );

    const result = await new ReplicateProvider('tok', {pollIntervalMs: 0}).generate(input);

    expect(result).toEqual({kind: 'url', url: 'https://cdn/out.png'});
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [createUrl, init] = fetchMock.mock.calls[0];
    expect(String(createUrl)).toContain('/models/zsxkib/instant-id/predictions');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Token tok');
  });

  it('throws on a failed prediction', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse({urls: {get: 'https://api/poll/1'}}, 201))
      .mockResolvedValueOnce(jsonResponse({status: 'failed', error: 'boom'}));

    await expect(
      new ReplicateProvider('tok', {pollIntervalMs: 0}).generate(input),
    ).rejects.toThrow(/boom/);
  });
});
