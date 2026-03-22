import type { PortfolioRepoRef } from "@/data/portfolioGithubRepos";

export type GitHubRepoDetail = {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  fork: boolean;
  topics: string[];
  pushedAt: string | null;
};

type GitHubRepoSingleApi = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  fork: boolean;
  topics?: string[];
  pushed_at: string | null;
};

function mapRepo(json: GitHubRepoSingleApi): GitHubRepoDetail {
  return {
    name: json.name,
    fullName: json.full_name,
    description: json.description,
    htmlUrl: json.html_url,
    homepage: json.homepage?.trim() ? json.homepage : null,
    language: json.language,
    fork: json.fork,
    topics: Array.isArray(json.topics) ? json.topics : [],
    pushedAt: json.pushed_at,
  };
}

function apiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchOneRepo(
  ref: PortfolioRepoRef,
  headers: Record<string, string>,
): Promise<GitHubRepoDetail | null> {
  const url = `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as GitHubRepoSingleApi;
  return mapRepo(json);
}

/**
 * Fetches each repo via GET /repos/{owner}/{repo}, preserving curated order.
 * Omits entries that fail (404, auth, network).
 */
export async function getGitHubReposCurated(
  refs: readonly PortfolioRepoRef[],
  options?: { token?: string },
): Promise<GitHubRepoDetail[]> {
  const headers = apiHeaders(options?.token);
  const results = await Promise.all(refs.map(ref => fetchOneRepo(ref, headers)));
  return results.filter((r): r is GitHubRepoDetail => r !== null);
}
