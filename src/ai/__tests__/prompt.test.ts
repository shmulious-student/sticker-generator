import {buildStickerPrompt, EXPRESSION_VARIATIONS} from '../prompt';

describe('buildStickerPrompt', () => {
  it('includes the base prompt and sticker styling', () => {
    const p = buildStickerPrompt('cartoon astronaut');
    expect(p).toMatch(/cartoon astronaut/);
    expect(p).toMatch(/die-cut sticker/);
    expect(p).toMatch(/preserve the person's facial likeness/);
  });

  it('falls back to a default subject when base is empty', () => {
    expect(buildStickerPrompt('   ')).toMatch(/a fun sticker/);
  });

  it('does not add an expression when only one variation', () => {
    const p = buildStickerPrompt('base', 0, 1);
    EXPRESSION_VARIATIONS.forEach(e => expect(p).not.toContain(e));
  });

  it('cycles distinct expressions across variations', () => {
    const a = buildStickerPrompt('base', 0, 3);
    const b = buildStickerPrompt('base', 1, 3);
    expect(a).toContain(EXPRESSION_VARIATIONS[0]);
    expect(b).toContain(EXPRESSION_VARIATIONS[1]);
    expect(a).not.toEqual(b);
  });
});
