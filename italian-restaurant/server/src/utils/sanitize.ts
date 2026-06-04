import sanitizeHtmlLib from "sanitize-html";

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\0/g, "")
    .replace(/[<>"'`]/g, (char) => HTML_ESCAPE_MAP[char] || char)
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    }
  }
  return sanitized;
}

export function stripNullBytes(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/\0/g, "");
}

export function escapeHtml(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function sanitizeHtmlContent(input: string): string {
  if (typeof input !== "string") return "";
  return sanitizeHtmlLib(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return encodeURI(trimmed);
}
