// Shared pieces for the satori OG templates (site.js, post.js).
import { OG_FONTS } from "../loadGoogleFont";

export const OG = { width: 1200, height: 630 };

// Light theme tokens (mirrors src/styles/global.css).
export const C = {
  paper: "#eef0ea",
  surface: "#f7f8f4",
  ink: "#141a17",
  inkSoft: "#4a544f",
  line: "#d3d8d0",
  marigold: "#e8a33d",
};

export const F = OG_FONTS;

/** Minimal element helper: h("div", style, children). */
export const h = (type, style = {}, children = undefined, extra = {}) => ({
  type,
  props: {
    style: type === "div" ? { display: "flex", ...style } : style,
    ...(children !== undefined && { children }),
    ...extra,
  },
});

/** The brand mark (same geometry as src/components/Logo.astro). */
export const mark = (size = 44) => ({
  type: "svg",
  props: {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    children: [
      { type: "rect", props: { width: 32, height: 32, rx: 8, fill: C.ink } },
      {
        type: "path",
        props: {
          d: "M10.5 11.5V25M21 13v1c0 6-10.5 4.5-10.5 10",
          stroke: C.paper,
          strokeWidth: 2.75,
          strokeLinecap: "round",
          fill: "none",
        },
      },
      {
        type: "circle",
        props: { cx: 10.5, cy: 11.5, r: 3.25, fill: C.paper },
      },
      {
        type: "circle",
        props: { cx: 21, cy: 11.5, r: 4.25, fill: C.marigold },
      },
    ],
  },
});

/** Small condensed mono caps label (mirrors `type-meta`). */
export const meta = (text, style = {}) =>
  h(
    "div",
    {
      fontFamily: F.meta,
      fontSize: 22,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: C.inkSoft,
      ...style,
    },
    text,
  );

/** Header row: mark + domain (+ optional section). */
export const brandRow = (domain, section) =>
  h("div", { alignItems: "center", gap: 18 }, [
    mark(44),
    h(
      "div",
      {
        fontFamily: F.mono,
        fontSize: 26,
        color: C.ink,
        letterSpacing: "-0.01em",
      },
      domain,
    ),
    ...(section
      ? [
          h("div", { fontFamily: F.mono, fontSize: 26, color: C.line }, "/"),
          meta(section, { fontSize: 24 }),
        ]
      : []),
  ]);

const node = (cx, cy, kind) => {
  if (kind === "head") {
    return [
      {
        type: "circle",
        props: {
          cx,
          cy,
          r: 40,
          fill: "none",
          stroke: C.marigold,
          strokeWidth: 3,
          strokeOpacity: 0.45,
        },
      },
      { type: "circle", props: { cx, cy, r: 24, fill: C.marigold } },
    ];
  }
  if (kind === "solid") {
    return [{ type: "circle", props: { cx, cy, r: 14, fill: C.ink } }];
  }
  return [
    {
      type: "circle",
      props: { cx, cy, r: 11, fill: C.surface, stroke: C.ink, strokeWidth: 4 },
    },
  ];
};

/**
 * Commit-graph illustrations, drawn in a 300×630 box.
 *
 * "branch" (site): a main rail running off the bottom edge and a branch forking
 * to a second lane, ending in the marigold head commit level with main's latest
 * commit (the same composition as the logo).
 * "log" (posts): one rail running edge to edge with past commits, this post as
 * the marigold node, and a short side branch merged back in below it.
 */
export const commitGraph = ({ variant = "branch" } = {}) => {
  const H = OG.height;
  const main = 96;
  const lane = 212;
  const stroke = {
    stroke: C.ink,
    strokeWidth: 4,
    strokeLinecap: "round",
    fill: "none",
  };
  const path = (d) => ({ type: "path", props: { d, ...stroke } });

  const children =
    variant === "log"
      ? [
          path(`M${main} 0V${H}`),
          // side branch: leaves main below, runs in the lane, merges into HEAD
          path(
            `M${main} 560C${main} 500 ${lane} 520 ${lane} 450V390C${lane} 330 ${main} 350 ${main} 300`,
          ),
          ...node(main, 80, "hollow"),
          ...node(main, 190, "hollow"),
          ...node(lane, 430, "hollow"),
          ...node(main, 430, "hollow"),
          ...node(main, 300, "head"),
        ]
      : [
          // main rail: from latest commit down, off the bottom edge
          path(`M${main} 170V${H}`),
          // branch: fork off main, curve into the lane, run up to the head
          path(`M${main} 500C${main} 430 ${lane} 450 ${lane} 380V170`),
          ...node(main, 330, "hollow"),
          ...node(main, H - 50, "hollow"),
          ...node(lane, 330, "hollow"),
          ...node(main, 170, "solid"),
          ...node(lane, 170, "head"),
        ];

  return {
    type: "svg",
    props: { width: 300, height: H, viewBox: `0 0 300 ${H}`, children },
  };
};

/** Right-hand panel that holds the graph. */
export const graphPanel = (opts) =>
  h(
    "div",
    {
      width: 300,
      height: OG.height,
      background: C.surface,
      borderLeft: `2px solid ${C.line}`,
    },
    [commitGraph(opts)],
  );

export const hostname = (url) => new URL(url).hostname;
