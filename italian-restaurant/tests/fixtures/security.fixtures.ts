export const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror="alert(1)">',
  '<svg onload="alert(1)">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<iframe src="javascript:alert(1)">',
  '<body onload="alert(1)">',
  '<input onfocus="alert(1)" autofocus>',
  '<marquee onstart="alert(1)">',
  '<details open ontoggle="alert(1)">',
  '<math><mi//xlink:href="javascript:alert(1)">',
];

export const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; SELECT * FROM users",
  "' UNION SELECT * FROM users --",
  "1' AND 1=1 --",
  "' OR 1=1 #",
  "admin' OR '1'='1'/*",
  "1' UNION SELECT null,username,password FROM users --",
  "'; EXEC xp_cmdshell('dir'); --",
];

export const pathTraversalPayloads = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "....//....//....//etc/passwd",
  "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  "..%252f..%252f..%252fetc/passwd",
  "/etc/passwd%00",
  "....\\....\\....\\windows\\win.ini",
];

export const csrfTokens = {
  valid: "csrf-token-abc123def456",
  expired: "csrf-token-expired-old",
  invalid: "not-a-real-csrf-token",
  empty: "",
};

export const jwtTokens = {
  validSecret: "test-secret-key-for-jwt-minimum-16",
  wrongSecret: "completely-wrong-secret-key-12345",
  expiredExpiry: "0s",
  validExpiry: "1h",
};

export const maliciousHeaders = {
  userAgent: '<script>alert("xss")</script>',
  referer: "javascript:alert(1)",
  xForwardedFor: "127.0.0.1'; DROP TABLE users; --",
  contentType: "../../etc/passwd",
};

export const rateLimitThresholds = {
  general: { maxRequests: 100, windowMs: 60000 },
  auth: { maxRequests: 10, windowMs: 900000 },
  order: { maxRequests: 30, windowMs: 60000 },
  reservation: { maxRequests: 20, windowMs: 60000 },
};

export const accountLockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMs: 900000,
  resetAfterSuccess: true,
};

export const securityHeaders = {
  expectedHeaders: [
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
    "strict-transport-security",
    "content-security-policy",
  ],
};

export const oversizedPayloads = {
  largeBody: "x".repeat(10 * 1024 * 1024),
  largeJson: { data: "x".repeat(5 * 1024 * 1024) },
};

export const invalidContentTypePayloads = [
  { contentType: "text/plain", body: "not json" },
  { contentType: "application/xml", body: "<root>data</root>" },
  { contentType: "multipart/form-data", body: "not-valid-multipart" },
];

export const authBypassAttempts = [
  { header: "Authorization", value: "" },
  { header: "Authorization", value: "Bearer" },
  { header: "Authorization", value: "Bearer " },
  { header: "Authorization", value: "Token abc123" },
  { header: "X-Auth-Token", value: "bypass-attempt" },
  { header: "X-Real-IP", value: "127.0.0.1" },
];
