import { SUPABASE_KEY, SUPABASE_URL } from "astro:env/server";

export type SubmissionTable = "contact_messages" | "post_feedback";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/**
 * Inserts one row through the Supabase REST API. The key is the publishable (anon)
 * key; row-level security only grants INSERT, so we ask for no row back.
 * Throws on any failure so the caller can report it.
 */
export async function insertRow(
  table: SubmissionTable,
  row: Record<string, unknown>
): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase is not configured");
  }
  const response = await fetch(new URL(`/rest/v1/${table}`, SUPABASE_URL), {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Supabase insert into ${table} failed: ${response.status} ${await response.text()}`);
  }
}
