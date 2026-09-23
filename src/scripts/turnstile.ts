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
 *
 * The widget is a cross-origin iframe, so its inside can't be styled. Instead the
 * helper wraps it (.ts__frame) with a status line (.ts__status) and sets
 * container[data-state] = checking | interactive | verified | expired | error;
 * global.css collapses the Cloudflare box once verified and shows our own status.
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

  const frame = document.createElement("div");
  frame.className = "ts__frame";
  const status = document.createElement("p");
  status.className = "ts__status type-meta";
  status.setAttribute("role", "status");
  container.classList.add("ts");
  container.replaceChildren(frame, status);

  const STATUS: Record<string, string> = {
    checking: "",
    interactive: "",
    verified: "✓ Verified, not a bot",
    expired: "Verification expired. Checking again…",
    error: "The spam check couldn't load. Reload the page, or email me instead.",
  };
  let collapseTimer: ReturnType<typeof setTimeout> | undefined;
  const setState = (state: keyof typeof STATUS) => {
    clearTimeout(collapseTimer);
    const apply = () => {
      container.dataset.state = state;
      status.textContent = STATUS[state];
    };
    // Let Cloudflare's own "Success!" show for a beat before collapsing it.
    if (state === "verified" && container.dataset.state === "interactive") {
      collapseTimer = setTimeout(apply, 900);
    } else {
      apply();
    }
  };
  setState("checking");

  let hasToken = false;
  let waiters: Array<(ok: boolean) => void> = [];
  const settle = (ok: boolean) => {
    hasToken = ok;
    if (ok) {
      waiters.forEach(resolve => resolve(true));
      waiters = [];
    }
  };

  const widgetId = api.render(frame, {
    sitekey: TURNSTILE_SITE_KEY,
    action,
    theme,
    size: "flexible",
    // Only shows a checkbox when Cloudflare actually needs an interaction.
    appearance: "interaction-only",
    "refresh-expired": "auto",
    callback: () => {
      settle(true);
      setState("verified");
    },
    "before-interactive-callback": () => setState("interactive"),
    "expired-callback": () => {
      settle(false);
      setState("expired");
    },
    "error-callback": () => {
      settle(false);
      setState("error");
    },
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
      setState("checking");
      api.reset(widgetId);
    },
    remove: () => api.remove(widgetId),
  };
}
