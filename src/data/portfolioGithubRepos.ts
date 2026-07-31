/** Curated repos aligned with resume / About. Order = display order. Set GITHUB_TOKEN in .env (or host secrets) for private repos or higher API rate limits. */
export type PortfolioRepoRef = {
  owner: string;
  repo: string;
  /** Optional homepage shown on the repo card (overrides the repo's GitHub homepage). */
  homepage?: string;
};

export const portfolioGithubRepos: readonly PortfolioRepoRef[] = [
  { owner: "jnzlab", repo: "lucid-hire" }, // LucidHire — AI candidate screening
  {
    owner: "jnzlab",
    repo: "easy-ytdlp", // easy-ytdlp — CLI media downloader
    homepage: "https://www.npmjs.com/package/@jnzlab/easy-ytdlp",
  },
  { owner: "jnzlab", repo: "hafizchaskapoint" }, // Hafiz Chaska Point — live shop-status microsite
];
