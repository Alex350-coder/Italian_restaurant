export const securityConfig = {
  password: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    specialChars: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
    maxAge: 90,
    preventReuse: 5,
    bcryptSaltRounds: 12,
    commonPasswordCheck: true,
    sequentialCharLimit: 3,
    keyboardPatternCheck: true,
  },

  account: {
    maxFailedAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000,
    resetAttemptsAfterMs: 30 * 60 * 1000,
    maxLoginAttemptsPerHour: 20,
    requireEmailVerification: true,
    passwordResetTokenTtlMs: 60 * 60 * 1000,
  },

  session: {
    accessTokenTtlMs: 60 * 60 * 1000,
    refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
    absoluteTimeoutMs: 24 * 60 * 60 * 1000,
    idleTimeoutMs: 30 * 60 * 1000,
    maxConcurrentSessions: 3,
    regenerateOnLogin: true,
    invalidateOnPasswordChange: true,
    trackMetadata: true,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
      "X-Request-ID",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "X-CSRF-Token",
      "X-Request-ID",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400,
  },

  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: 50,
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 20,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000,
      max: 3,
    },
    sessionManagement: {
      windowMs: 15 * 60 * 1000,
      max: 20,
    },
  },

  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        childSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: {
      camera: "()",
      microphone: "()",
      geolocation: "(self)",
      payment: "(self)",
      usb: "()",
      magnetometer: "()",
      gyroscope: "()",
      accelerometer: "()",
    },
  },

  ip: {
    autoBanThreshold: 10,
    autoBanWindowMs: 5 * 60 * 1000,
    manualBanDurationMs: 24 * 60 * 60 * 1000,
    whitelist: [] as string[],
    blacklist: [] as string[],
  },

  request: {
    defaultMaxSize: "1mb",
    uploadMaxSize: "10mb",
    maxUrlLength: 2048,
    maxHeaderSize: 8192,
    maxParams: 20,
  },

  monitoring: {
    enabled: true,
    logLevel: "info" as "debug" | "info" | "warn" | "error",
    alertThresholds: {
      bruteForce: { count: 5, windowMs: 15 * 60 * 1000 },
      sqlInjection: { count: 1, windowMs: 60 * 60 * 1000 },
      xssAttempt: { count: 1, windowMs: 60 * 60 * 1000 },
      rateLimitExceeded: { count: 10, windowMs: 15 * 60 * 1000 },
      suspiciousActivity: { count: 3, windowMs: 30 * 60 * 1000 },
      unauthorizedAccess: { count: 5, windowMs: 15 * 60 * 1000 },
    },
    retentionDays: 90,
  },

  encryption: {
    algorithm: "aes-256-gcm",
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },
} as const;

export type SecurityConfig = typeof securityConfig;

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { password: policy } = securityConfig;

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must be at most ${policy.maxLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (policy.requireSpecialChar) {
    const specialCharRegex = new RegExp(
      `[${policy.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`
    );
    if (!specialCharRegex.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password must not contain 3+ consecutive identical characters");
  }

  return { valid: errors.length === 0, errors };
}

export function validateSessionConfig(): boolean {
  const { session } = securityConfig;

  if (session.accessTokenTtlMs >= session.refreshTokenTtlMs) {
    console.warn("Access token TTL should be less than refresh token TTL");
    return false;
  }

  if (session.idleTimeoutMs >= session.absoluteTimeoutMs) {
    console.warn("Idle timeout should be less than absolute timeout");
    return false;
  }

  return true;
}

export function getSecurityConfig() {
  return { ...securityConfig };
}
