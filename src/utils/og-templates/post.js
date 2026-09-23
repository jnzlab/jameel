import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { C, F, OG, brandRow, graphPanel, h, hostname, meta } from "./shared";

// Title size steps by length so long titles still fit in ~4 lines.
const titleSize = (title) => {
  const n = title.length;
  if (n <= 32) return 76;
  if (n <= 50) return 64;
  if (n <= 70) return 54;
  if (n <= 90) return 46;
  return 42;
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: SITE.timezone || "UTC",
  }).format(date);

export default async (post) => {
  const { title, author = SITE.author, pubDatetime, modDatetime } = post.data;
  const domain = hostname(SITE.website);
  const date = formatDate(new Date(modDatetime ?? pubDatetime));
  const size = titleSize(title);

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
            brandRow(domain, "Writing"),
            h(
              "div",
              {
                // short titles get the wide display cut, like page titles
                fontFamily: title.length <= 32 ? F.display : F.mono,
                fontSize: size,
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                maxHeight: size * 1.12 * 4,
                overflow: "hidden",
              },
              title,
            ),
            h(
              "div",
              {
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 22,
                borderTop: `2px solid ${C.line}`,
              },
              [
                h(
                  "div",
                  {
                    fontFamily: F.body,
                    fontWeight: 500,
                    fontSize: 28,
                    color: C.ink,
                  },
                  author,
                ),
                meta(date),
              ],
            ),
          ],
        ),
        graphPanel({ variant: "log" }),
      ],
    ),
    {
      width: OG.width,
      height: OG.height,
      embedFont: true,
      fonts: await loadGoogleFonts(title + author + domain + date + "Writing/"),
    },
  );
};
