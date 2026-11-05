import { describe, expect, it } from "vitest";
import { anamneseToHtml } from "./anamnese-html";
import type { Anamnese } from "@/lib/types";

const base = { id: "1" } as unknown as Anamnese;

describe("anamneseToHtml (XSS)", () => {
  it("removes script tags and inline event handlers from rich text", () => {
    const html = anamneseToHtml({
      ...base,
      anamneseTexto: '<p>ok</p><img src=x onerror="alert(1)"><script>alert(2)</script>',
    } as Anamnese);

    expect(html).toContain("<p>ok</p>");
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/onerror/i);
  });

  it("removes javascript: URLs", () => {
    const html = anamneseToHtml({
      ...base,
      anamneseTexto: '<a href="javascript:alert(1)">clique</a>',
    } as Anamnese);

    expect(html).not.toMatch(/javascript:/i);
  });

  it("escapes legacy plain-text fields instead of rendering them as HTML", () => {
    const html = anamneseToHtml({
      ...base,
      anamneseTexto: "",
      queixaPrincipal: '<script>alert(3)</script>',
    } as Anamnese);

    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("&lt;script&gt;");
  });
});
