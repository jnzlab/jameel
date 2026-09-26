/**
 * Selected work shown on the home page. Order = display order.
 * `repo` links a project to its GitHub metadata (language, last push) when available.
 * Keep `detail` and `proof` factual: they are taken from the About page.
 */
export type Project = {
  name: string;
  href: string;
  kind: string;
  summary: string;
  /** One concrete, verifiable detail that shows how the thing was built. */
  proof: string;
  stack: string[];
  repo?: { owner: string; repo: string };
  status: "live" | "published";
};

export const projects: readonly Project[] = [
  {
    name: "LucidHire",
    href: "https://lucidhire.io",
    kind: "AI candidate screening",
    summary:
      "Multi-tenant hiring platform that extracts structured data from CVs and ranks candidates with hybrid vector search and LLM re-ranking.",
    proof:
      "HNSW-indexed 768-dim embeddings narrow the pool to a top-20 shortlist before LLM scoring; a 6-stage CV pipeline streams status over SSE.",
    stack: ["Next.js 16", "Neon + pgvector", "Gemini", "Trigger.dev", "Clerk"],
    repo: { owner: "jnzlab", repo: "lucid-hire" },
    status: "live",
  },
  {
    name: "Tahir Pilot School",
    href: "https://tahirpilotschool.com",
    kind: "School management system",
    summary:
      "Complete management system for a Gujranwala school, Playgroup to Matric: admissions, attendance, timetables, results, fees and payroll, with separate portals for admins, teachers and students.",
    proof:
      "Marks a teacher enters wait for admin approval before they reach a result card; portraits are cut out on upload with Cloudflare Images, and ID cards print eight to an A4 sheet.",
    stack: ["Next.js (vinext)", "Cloudflare Workers", "D1", "R2", "Clerk"],
    status: "live",
  },
  {
    name: "Pouch Parlour",
    href: "https://pouchparlour.com",
    kind: "E-commerce storefront",
    summary:
      "Storefront for phone covers and keychains with guest-first checkout, immutable order snapshots, and an admin dashboard.",
    proof:
      "A Rust/WASM image worker behind a Service Binding cuts a 3.9 MB upload to ~314 KB (~92% smaller).",
    stack: ["Cloudflare Workers", "D1", "R2", "Next.js 16", "Drizzle"],
    status: "live",
  },
  {
    name: "easy-ytdlp",
    href: "https://www.npmjs.com/package/@jnzlab/easy-ytdlp",
    kind: "CLI tool on npm",
    summary:
      "Wraps yt-dlp in a plain-English question flow, so nobody has to memorise flags or install Python.",
    proof:
      "Pure-function flag builder shared by the wizard and a non-interactive mode; self-updating binaries with atomic replacement.",
    stack: ["TypeScript", "Node.js", "npm", "GitHub Releases"],
    repo: { owner: "jnzlab", repo: "easy-ytdlp" },
    status: "published",
  },
  {
    name: "Hafiz Chaska Point",
    href: "https://hafizchaskapoint.vercel.app",
    kind: "Live shop-status site",
    summary:
      "Lets customers of a local shop check in real time whether it is open, with push notifications when it opens.",
    proof:
      "Server Components with a 5-second revalidating cache plus SWR polling; PIN admin with constant-time checks and rate limiting.",
    stack: ["Next.js", "SWR", "Web Push", "Vercel"],
    repo: { owner: "jnzlab", repo: "hafizchaskapoint" },
    status: "live",
  },
];
