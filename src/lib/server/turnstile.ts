import { TURNSTILE_HOSTNAMES, TURNSTILE_SECRET } from "astro:env/server";
import { SITE } from "@/config";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Turnstile actions, one per protected surface. Must match the widget's data-action. */
export type TurnstileAction = "contact" | "feedback";

function expectedHostnames(): Set<string> {
  const configured = (TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map(hostname => hostname.trim())
    .filter(Boolean);
  const siteHost = new URL(SITE.website).hostname;
  const hostnames = configured.length > 0 ? configured : [siteHost, `www.${siteHost}`];
  // Local hostnames are only ever accepted by the dev server, never in production.
  if (import.meta.env.DEV) hostnames.push("localhost", "127.0.0.1");
  return new Set(hostnames);
}

/**
 * Canonical server-side siteverify. Fails closed: returns false on a missing or
 * oversized token, a network/HTTP error, an unsuccessful result, or an unexpected
 * action or hostname. Tokens are single-use, so each call redeems the token.
 */
export async function verifyTurnstile(
  token: unknown,
  action: TurnstileAction,
  remoteIp?: string
): Promise<boolean> {
  const hostnames = expectedHostnames();
  if (
    !TURNSTILE_SECRET ||
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    hostnames.size === 0
  ) {
    return false;
  }

  const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    return (
      result.success === true &&
      result.action === action &&
      typeof result.hostname === "string" &&
      hostnames.has(result.hostname)
    );
  } catch {
    return false;
  }
}
