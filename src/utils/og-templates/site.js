import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { C, F, OG, brandRow, graphPanel, h, hostname, meta } from "./shared";

// One-line positioning, condensed from SITE.desc (kept factual).
const TAGLINE =
  "Full-stack developer (Next.js, TypeScript) shipping AI products, e-commerce, and CLI tools.";
const PLACE = "Gujranwala, Pakistan";

export default async () => {
  const domain = hostname(SITE.website);
  const [first, ...rest] = SITE.title.split(" ");

  return satori(
    h(
      "div",
      {
        width: "100%",
        height: "100%",
        background: C.paper,
        color: C.ink,
      },
      [
        h(
          "div",
          {
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 72px 56px",
          },
          [
            brandRow(domain),
            h("div", { flexDirection: "column" }, [
              h(
                "div",
                {
                  flexDirection: "column",
                  fontFamily: F.display,
                  fontSize: 112,
                  lineHeight: 0.98,
                  letterSpacing: "-0.045em",
                },
                [h("div", {}, first), h("div", {}, rest.join(" "))],
              ),
              h(
                "div",
                {
                  marginTop: 30,
                  maxWidth: 700,
                  fontFamily: F.body,
                  fontSize: 30,
                  lineHeight: 1.35,
                  color: C.inkSoft,
                },
                TAGLINE,
              ),
            ]),
            h(
              "div",
              {
                alignItems: "center",
                gap: 14,
                paddingTop: 22,
                borderTop: `2px solid ${C.line}`,
              },
              [
                h("div", {
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: C.marigold,
                }),
                meta("Portfolio & writing"),
                meta("·", { color: C.line }),
                meta(PLACE),
              ],
            ),
          ],
        ),
        graphPanel({ variant: "branch" }),
      ],
    ),
    {
      width: OG.width,
      height: OG.height,
      embedFont: true,
      fonts: await loadGoogleFonts(
        SITE.title + TAGLINE + PLACE + domain + "Portfolio & writing·/",
      ),
    },
  );
};
