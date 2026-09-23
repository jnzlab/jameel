import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { getCollection } from "astro:content";
import { z } from "astro/zod";
import { SITE } from "@/config";
import { getPath } from "@/utils/getPath";
import { sendNotification } from "@/lib/server/email";
import { insertRow, isSupabaseConfigured } from "@/lib/server/supabase";
import { verifyTurnstile } from "@/lib/server/turnstile";

/*
 * Contract for the UI (both actions accept FormData from a <form>):
 *   actions.contact(formData)  fields: name, email, message, company (honeypot,
 *                              leave empty), cf-turnstile-response
 *   actions.feedback(formData) fields: slug (post id), helpful ("yes" | "no"),
 *                              comment?, email?, company (honeypot),
 *                              cf-turnstile-response
 * Both resolve { data: { ok: true } } on success, or { error } where
 * error.code is BAD_REQUEST (validation, error.fields per field), FORBIDDEN
 * (bot check failed: reset the widget and retry), or INTERNAL_SERVER_ERROR.
 */

// Astro's form parsing turns empty or absent fields into null, so optional
// fields accept null and are normalised to undefined.
const turnstileToken = z.string().max(2048).nullish();
const honeypot = z.string().max(200).nullish();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform(value => (value ? value : undefined));

function clientIp(context: ActionAPIContext): string | undefined {
  try {
    return context.clientAddress;
  } catch {
    return undefined;
  }
}

async function guard(
  context: ActionAPIContext,
  token: string | null | undefined,
  action: "contact" | "feedback"
) {
  if (!isSupabaseConfigured()) {
    throw new ActionError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Messages can't be received right now. Please email me instead.",
    });
  }
  if (!(await verifyTurnstile(token, action, clientIp(context)))) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "The spam check didn't pass. Please try again.",
    });
  }
}

async function notify(subject: string, text: string, replyTo?: string) {
  try {
    await sendNotification({ subject, text, replyTo });
  } catch (error) {
    // The submission is already stored; a failed email must not fail the request.
    // eslint-disable-next-line no-console
    console.error("[notify] email failed:", error);
  }
}

export const server = {
  contact: defineAction({
    accept: "form",
    input: z.object({
      name: z
        .string({ error: "Enter your name" })
        .trim()
        .min(1, "Enter your name")
        .max(100, "Keep your name under 100 characters"),
      email: z.email({ error: "Enter a valid email address" }).max(254),
      message: z
        .string({ error: "Write at least 10 characters" })
        .trim()
        .min(10, "Write at least 10 characters")
        .max(5000, "Keep your message under 5,000 characters"),
      company: honeypot,
      "cf-turnstile-response": turnstileToken,
    }),
    handler: async (input, context) => {
      // Bots fill the hidden field; pretend it worked and store nothing.
      if (input.company) return { ok: true as const };

      await guard(context, input["cf-turnstile-response"], "contact");

      try {
        await insertRow("contact_messages", {
          name: input.name,
          email: input.email,
          message: input.message,
          source_path: "/contact",
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[contact] insert failed:", error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Your message couldn't be sent. Please try again or email me.",
        });
      }

      await notify(
        `New message from ${input.name}`,
        `${input.message}\n\n— ${input.name} <${input.email}>\nSent from ${SITE.website}contact`,
        input.email
      );
      return { ok: true as const };
    },
  }),

  feedback: defineAction({
    accept: "form",
    input: z.object({
      slug: z.string().trim().min(1).max(200),
      helpful: z.enum(["yes", "no"]),
      comment: optionalText(2000),
      email: z
        .union([z.email({ error: "Enter a valid email address" }).max(254), z.literal("")])
        .nullish()
        .transform(value => (value ? value : undefined)),
      company: honeypot,
      "cf-turnstile-response": turnstileToken,
    }),
    handler: async (input, context) => {
      if (input.company) return { ok: true as const };

      const posts = await getCollection("blog", ({ data }) => !data.draft);
      const post = posts.find(entry => entry.id === input.slug);
      if (!post) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Unknown post." });
      }

      await guard(context, input["cf-turnstile-response"], "feedback");

      try {
        await insertRow("post_feedback", {
          post_slug: post.id,
          helpful: input.helpful === "yes",
          comment: input.comment ?? null,
          email: input.email ?? null,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[feedback] insert failed:", error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Your feedback couldn't be saved. Please try again.",
        });
      }

      const url = new URL(getPath(post.id, post.filePath), SITE.website).href;
      await notify(
        `${input.helpful === "yes" ? "👍 Helpful" : "👎 Not helpful"}: ${post.data.title}`,
        [
          `Post: ${post.data.title}`,
          url,
          `Helpful: ${input.helpful}`,
          input.comment ? `\n${input.comment}` : "(no comment)",
          input.email ? `\nReader email: ${input.email}` : "",
        ].join("\n"),
        input.email
      );
      return { ok: true as const };
    },
  }),
};
