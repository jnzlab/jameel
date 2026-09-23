/** Open-source contributions and career milestones, taken from the About page. */

export type Contribution = {
  project: string;
  summary: string;
  prs: { label: string; href: string }[];
  merged: boolean;
};

export const contributions: readonly Contribution[] = [
  {
    project: "Neon",
    summary:
      "Fixed a function-name mismatch in the Clerk + Neon auth docs and a broken import path that caused runtime errors.",
    prs: [
      { label: "#3099", href: "https://github.com/neondatabase/website/pull/3099" },
      { label: "#3100", href: "https://github.com/neondatabase/website/pull/3100" },
    ],
    merged: true,
  },
  {
    project: "Clerk",
    summary:
      "Documented username validation rules behind silent 422 errors in the Backend SDK; the guidance was later folded into the official docs.",
    prs: [
      { label: "#2434", href: "https://github.com/clerk/clerk-docs/pull/2434" },
      { label: "#2603", href: "https://github.com/clerk/clerk-docs/pull/2603" },
    ],
    merged: false,
  },
  {
    project: "Appwrite",
    summary: "Documentation fix merged into the Appwrite website.",
    prs: [{ label: "#1472", href: "https://github.com/appwrite/website/pull/1472" }],
    merged: true,
  },
];

/**
 * Milestones plotted on the commit graph alongside posts.
 * `date` is the earliest precise date we know; `precision` controls how it is printed.
 */
export type Milestone = {
  title: string;
  detail: string;
  date: Date;
  precision: "year" | "month";
  href?: string;
};

export const milestones: readonly Milestone[] = [
  {
    title: "Started freelancing with Innovorus",
    detail: "Owning client web projects end to end",
    date: new Date("2025-04-01T00:00:00+05:00"),
    precision: "month",
    href: "https://www.innovorus.com/",
  },
  {
    title: "Graduated, BS Computer Science",
    detail: "GIFT University · CGPA 3.8/4.0",
    date: new Date("2025-01-01T00:00:00+05:00"),
    precision: "year",
  },
  {
    title: "Started BS Computer Science",
    detail: "GIFT University",
    date: new Date("2021-01-01T00:00:00+05:00"),
    precision: "year",
  },
];
