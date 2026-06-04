const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const PHONE_REGEX = /^\+?1?\d{9,15}$|^\(\d{3}\)\s?\d{3}-?\d{4}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export function isValidUUID(str: unknown): str is string {
  return typeof str === "string" && UUID_REGEX.test(str);
}

export function isValidEmail(str: unknown): str is string {
  return typeof str === "string" && EMAIL_REGEX.test(str) && str.length <= 254;
}

export function isValidPhone(str: unknown): str is string {
  if (typeof str !== "string") return false;
  const cleaned = str.replace(/[\s\-\(\)]/g, "");
  return PHONE_REGEX.test(cleaned);
}

export function isStrongPassword(str: unknown): str is string {
  return typeof str === "string" && STRONG_PASSWORD_REGEX.test(str);
}

export function isValidDate(str: unknown): str is string {
  if (typeof str !== "string" || !DATE_REGEX.test(str)) return false;
  const date = new Date(str);
  return !isNaN(date.getTime()) && str === date.toISOString().split("T")[0];
}

export function isValidTime(str: unknown): str is string {
  if (typeof str !== "string" || !TIME_REGEX.test(str)) return false;
  const [hours, minutes] = str.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function isValidUrl(str: unknown): str is string {
  if (typeof str !== "string") return false;
  try {
    const url = new URL(str);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function isValidInteger(str: unknown): str is string {
  return typeof str === "string" && /^\d+$/.test(str) && parseInt(str, 10) > 0;
}
