export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { valid: false, error: "Email is too long" };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password must be at most 128 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: "Password must contain at least one special character" };
  }

  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== "string") {
    return { valid: false, error: "Phone number is required" };
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const phoneRegex = /^\+?1?\d{9,15}$/;

  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: "Invalid phone number format" };
  }

  return { valid: true };
}

export function validateReservationDate(date: string): ValidationResult {
  if (!date || typeof date !== "string") {
    return { valid: false, error: "Date is required" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: "Date must be in YYYY-MM-DD format" };
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { valid: false, error: "Invalid date" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) {
    return { valid: false, error: "Reservation date must be today or in the future" };
  }

  return { valid: true };
}

export function validateGuestCount(count: number): ValidationResult {
  if (typeof count !== "number" || isNaN(count)) {
    return { valid: false, error: "Guest count must be a number" };
  }

  if (!Number.isInteger(count)) {
    return { valid: false, error: "Guest count must be a whole number" };
  }

  if (count < 1) {
    return { valid: false, error: "Guest count must be at least 1" };
  }

  if (count > 20) {
    return { valid: false, error: "Maximum party size is 20" };
  }

  return { valid: true };
}

export function validateReservationTime(time: string): ValidationResult {
  if (!time || typeof time !== "string") {
    return { valid: false, error: "Time is required" };
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { valid: false, error: "Time must be in HH:MM format" };
  }

  const [hours, minutes] = time.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { valid: false, error: "Invalid time" };
  }

  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Name is required" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Name must be at most 100 characters" };
  }

  return { valid: true };
}
