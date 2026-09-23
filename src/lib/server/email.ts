import { CONTACT_TO_EMAIL, RESEND_API_KEY, RESEND_FROM } from "astro:env/server";

type Notification = {
  subject: string;
  text: string;
  /** Visitor's address, so replying in your mail client answers them directly. */
  replyTo?: string;
};

/**
 * Emails a plain-text notification to CONTACT_TO_EMAIL via Resend.
 * Throws on failure; callers treat email as best-effort after the row is stored.
 */
export async function sendNotification({ subject, text, replyTo }: Notification): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("Resend is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [CONTACT_TO_EMAIL],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend send failed: ${response.status} ${await response.text()}`);
  }
}
