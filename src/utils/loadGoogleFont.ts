/**
 * Fonts for the build-time OG images (satori).
 *
 * The site itself self-hosts Martian Mono / Hanken Grotesk via
 * @fontsource-variable, but those packages ship woff2 variable files only, and
 * satori needs static ttf/otf/woff. So we ask Google Fonts' css2 API for static
 * instances (a single wght/wdth per request) subset to the text we render.
 * The legacy Safari user agent makes Google return TrueType instead of woff2.
 */

type FontStyle = "normal" | "italic";

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: FontStyle;
};

type FontSpec = {
  /** Family name used in satori `fontFamily`. */
  name: string;
  /** Google Fonts family (URL form). */
  family: string;
  weight: SatoriFont["weight"];
  /** Optional width axis value (Martian Mono supports 75–112.5). */
  width?: number;
};

/** Family names to use in the OG templates. */
export const OG_FONTS = {
  /** Martian Mono 700 at 112.5% width: matches `type-display`. */
  display: "Martian Mono Wide",
  /** Martian Mono at normal width (titles that need more characters per line). */
  mono: "Martian Mono",
  /** Martian Mono 400 at 87.5% width: matches `type-meta`. */
  meta: "Martian Mono Condensed",
  body: "Hanken Grotesk",
} as const;

const FONT_SPECS: FontSpec[] = [
  { name: OG_FONTS.display, family: "Martian+Mono", weight: 700, width: 112.5 },
  { name: OG_FONTS.mono, family: "Martian+Mono", weight: 700 },
  { name: OG_FONTS.meta, family: "Martian+Mono", weight: 400, width: 87.5 },
  { name: OG_FONTS.body, family: "Hanken+Grotesk", weight: 400 },
  { name: OG_FONTS.body, family: "Hanken+Grotesk", weight: 500 },
];

const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

async function loadGoogleFont(
  { family, weight, width }: FontSpec,
  text: string,
): Promise<ArrayBuffer> {
  const axes = width ? `wdth,wght@${width},${weight}` : `wght@${weight}`;
  const API = `https://fonts.googleapis.com/css2?family=${family}:${axes}&text=${encodeURIComponent(text)}`;

  const css = await (
    await fetch(API, { headers: { "User-Agent": LEGACY_UA } })
  ).text();

  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
  );

  if (!resource) throw new Error(`Failed to download dynamic font ${family}`);

  const res = await fetch(resource[1]);

  if (!res.ok) {
    throw new Error("Failed to download dynamic font. Status: " + res.status);
  }

  return res.arrayBuffer();
}

async function loadGoogleFonts(text: string): Promise<SatoriFont[]> {
  // Subset every font to the same glyph set (plus uppercase, for meta labels
  // that use textTransform); cheap and avoids missing glyphs.
  const glyphs = Array.from(new Set(text + text.toUpperCase())).join("");

  return Promise.all(
    FONT_SPECS.map(async (spec) => ({
      name: spec.name,
      data: await loadGoogleFont(spec, glyphs),
      weight: spec.weight,
      style: "normal" as const,
    })),
  );
}

export default loadGoogleFonts;
