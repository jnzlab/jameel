/** Curated repos aligned with resume / About. Order = display order. Set GITHUB_TOKEN in .env (or host secrets) for private repos or higher API rate limits. */
export type PortfolioRepoRef = {
  owner: string;
  repo: string;
};

export const portfolioGithubRepos: readonly PortfolioRepoRef[] = [
  { owner: "jnzlab", repo: "lucid-hire" },
  { owner: "jnzlab", repo: "adaptive-bitrate-streaming" },
  { owner: "jnzlab", repo: "wellness_tracking_app" },
  { owner: "jnzlab", repo: "sms" },
  { owner: "jnzlab", repo: "jameel" },
  { owner: "jnzlab", repo: "IOPaint" },
];
