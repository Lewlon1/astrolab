/**
 * ManyChat CSV parsing and column detection.
 *
 * IMPORTANT: no real ManyChat export was available when this was written, and
 * the brief said not to guess the column set. So this does not assume one.
 * It detects columns by alias, reports every header it did not recognise, and
 * the upload route accepts an explicit mapping override. Nothing merges on a
 * column the parser was unsure about, and no row is dropped silently.
 *
 * Once a real export exists, the fix is to add its headers to FIELD_ALIASES —
 * not to rewrite the parser.
 */

/**
 * Canonical field → header aliases, lower-cased and stripped of non-alphanumerics.
 * Deliberately broad: ManyChat's export headers vary by locale and by which
 * custom fields the account has defined.
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  email: ["email", "emailaddress", "correo", "correoelectronico", "mail"],
  ig_handle: [
    "instagram", "instagramusername", "igusername", "ighandle", "handle",
    "username", "iguser", "instagramhandle", "usuario",
  ],
  name: ["name", "fullname", "firstname", "first", "nombre", "subscribername"],
  last_name: ["lastname", "surname", "apellido", "last"],
  subscribed_at: [
    "subscribed", "subscribedat", "subscribeddate", "optinat", "optindate",
    "created", "createdat", "signupdate", "fechaalta",
  ],
  last_activity_at: [
    "lastinteraction", "lastinteractionat", "lastactive", "lastactivity",
    "lastseen", "ultimainteraccion",
  ],
  language: ["language", "locale", "lang", "idioma"],
  tags: ["tags", "tag", "labels", "etiquetas"],
  status: ["status", "subscriberstatus", "estado"],
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * RFC4180-ish parser: handles quoted fields, embedded commas and newlines,
 * CRLF line endings, and "" escapes. Blank lines are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Strip a UTF-8 BOM — Excel adds one and it corrupts the first header.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // handled by the \n branch
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Maps headers to canonical fields, returning both hits and misses so the
 * merge report can show exactly what was and was not used.
 */
export function detectColumns(headers: string[]): {
  mapping: Record<string, string>;
  unmapped: string[];
} {
  const mapping: Record<string, string> = {};
  const unmapped: string[] = [];

  for (const header of headers) {
    const key = normaliseHeader(header);
    if (!key) continue;

    const match = Object.entries(FIELD_ALIASES).find(([, aliases]) =>
      aliases.includes(key)
    );

    // First header wins for a given field; later duplicates are reported as
    // unmapped rather than silently overwriting.
    if (match && !Object.values(mapping).includes(match[0])) {
      mapping[header] = match[0];
    } else {
      unmapped.push(header);
    }
  }

  return { mapping, unmapped };
}

/** Normalises "@user", "instagram.com/user/" and bare handles to "user". */
export function cleanHandle(v: string): string | null {
  const h = v
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return h.length > 0 ? h : null;
}
