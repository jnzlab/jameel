/**
 * Client helper for Cloudflare Turnstile, rendered explicitly so each form owns
 * its widget and can reset it: tokens are single-use, so a form that stays on
 * the page must call reset() after every submission attempt.
 *
 * Usage:
 *   const widget = await mountTurnstile(containerEl, "contact");
 *   ...submit FormData (the widget adds a hidden `cf-turnstile-response` input
 *      inside containerEl, so put the container inside the <form>)...
 *   widget?.reset();
 * Before submitting, `await widget?.ready()` so a fast submit doesn't race the
 * token (resolves false if no token arrives within the timeout).
 * Returns null when no site key is configured, so forms still render in dev.
 */
import { TURNSTILE_SITE_KEY } from "astro:env/client";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile failed to load"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type TurnstileWidget = {
  /** Resolves true once a token is available, false after `timeoutMs`. */
  ready: (timeoutMs?: number) => Promise<boolean>;
  reset: () => void;
  remove: () => void;
};

export async function mountTurnstile(
  container: HTMLElement,
  action: "contact" | "feedback"
): Promise<TurnstileWidget | null> {
  if (!TURNSTILE_SITE_KEY) return null;
  const api = await loadScript();
  const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";

  let hasToken = false;
  let waiters: Array<(ok: boolean) => void> = [];
  const settle = (ok: boolean) => {
    hasToken = ok;
    if (ok) {
      waiters.forEach(resolve => resolve(true));
      waiters = [];
    }
  };

  const widgetId = api.render(container, {
    sitekey: TURNSTILE_SITE_KEY,
    action,
    theme,
    size: "flexible",
    // Only shows a checkbox when Cloudflare actually needs an interaction.
    appearance: "interaction-only",
    callback: () => settle(true),
    "expired-callback": () => settle(false),
    "error-callback": () => settle(false),
  });
  return {
    ready: (timeoutMs = 8000) =>
      hasToken
        ? Promise.resolve(true)
        : new Promise(resolve => {
            waiters.push(resolve);
            setTimeout(() => resolve(hasToken), timeoutMs);
          }),
    reset: () => {
      settle(false);
      api.reset(widgetId);
    },
    remove: () => api.remove(widgetId),
  };
}
