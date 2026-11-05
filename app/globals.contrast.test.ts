import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Rgb = [number, number, number];

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const body = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

const hex = (value: string): Rgb => {
  const m = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) throw new Error(`Cor não hexadecimal: ${value}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
};

const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb =>
  fg.map((v, i) => v * alpha + bg[i] * (1 - alpha)) as Rgb;

const luminance = ([r, g, b]: Rgb): number => {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = 4.5;
const CONTROL = 3;

const light = tokens(":root");
const dark = tokens(".dark");
const WHITE: Rgb = [255, 255, 255];

describe("contraste dos tokens (WCAG AA)", () => {
  it.each([
    ["primary", "background"],
    ["primary", "card"],
    ["primary", "muted"],
    ["primary", "sidebar"],
    ["primary", "sidebar-accent"],
    ["primary-foreground", "primary"],
    ["chart-1", "card"],
    ["chart-2", "card"],
    ["chart-3", "card"],
    ["chart-4", "card"],
    ["chart-5", "card"],
    ["destructive", "background"],
    ["destructive", "card"],
    ["holiday", "holiday-bg"],
  ])("claro: %s sobre %s", (fg, bg) => {
    expect(contrast(hex(light[fg]), hex(light[bg]))).toBeGreaterThanOrEqual(TEXT);
  });

  it.each([
    ["primary", "background"],
    ["primary", "card"],
    ["primary", "muted"],
    ["primary", "sidebar"],
    ["primary", "sidebar-accent"],
    ["primary-foreground", "primary"],
    ["chart-1", "card"],
    ["chart-2", "card"],
    ["chart-3", "card"],
    ["chart-4", "card"],
    ["chart-5", "card"],
    ["destructive", "background"],
    ["destructive", "card"],
  ])("escuro: %s sobre %s", (fg, bg) => {
    expect(contrast(hex(dark[fg]), hex(dark[bg]))).toBeGreaterThanOrEqual(TEXT);
  });

  it("claro: borda de campo sobre background e card", () => {
    for (const bg of ["background", "card"]) {
      expect(contrast(hex(light.input), hex(light[bg]))).toBeGreaterThanOrEqual(CONTROL);
    }
  });

  it("escuro: borda de campo sobre background e card", () => {
    const alpha = Number(dark.input.match(/\/\s*([\d.]+)%/)?.[1]) / 100;
    for (const bg of ["background", "card"]) {
      const surface = hex(dark[bg]);
      expect(contrast(over(WHITE, alpha, surface), surface)).toBeGreaterThanOrEqual(CONTROL);
    }
  });

  it("claro: texto de botão no hover de primary e destructive", () => {
    const card = hex(light.card);
    expect(
      contrast(hex(light["primary-foreground"]), over(hex(light.primary), 0.9, card)),
    ).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(WHITE, over(hex(light.destructive), 0.9, card))).toBeGreaterThanOrEqual(TEXT);
  });

  it("escuro: texto branco no botão destructive (dark:bg-destructive/40)", () => {
    expect(
      contrast(WHITE, over(hex(dark.destructive), 0.4, hex(dark.background))),
    ).toBeGreaterThanOrEqual(TEXT);
  });
});
