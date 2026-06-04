import { describe, it, expect } from "vitest";

function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  let sanitized = input;

  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*>/gi, "");
  sanitized = sanitized.replace(/<\/script>/gi, "");

  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*\S+/gi, "");

  sanitized = sanitized.replace(/javascript\s*:/gi, "");

  sanitized = sanitized.replace(/</g, "&lt;");
  sanitized = sanitized.replace(/>/g, "&gt;");
  sanitized = sanitized.replace(/"/g, "&quot;");
  sanitized = sanitized.replace(/'/g, "&#x27;");

  sanitized = sanitized.replace(/\0/g, "");

  return sanitized;
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

describe("Sanitization", () => {
  describe("XSS Script Tag Removal", () => {
    it("should remove simple script tags", () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("should remove script tags with attributes", () => {
      const input = '<script src="evil.js"></script>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("<script");
    });

    it("should remove nested script tags", () => {
      const input = '<script><script>alert(1)</script></script>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("script");
    });

    it("should remove script tags with newlines", () => {
      const input = "<script\nalert(1)\n</script>";
      const result = sanitizeInput(input);

      expect(result).not.toContain("<script>");
    });
  });

  describe("Event Handler Removal", () => {
    it("should remove onclick handler", () => {
      const input = '<div onclick="alert(1)">text</div>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("onclick");
    });

    it("should remove onerror handler", () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = sanitizeInput(input);

      expect(result).not.toContain("onerror");
    });

    it("should remove onload handler", () => {
      const input = '<body onload="alert(1)">';
      const result = sanitizeInput(input);

      expect(result).not.toContain("onload");
    });

    it("should remove multiple event handlers", () => {
      const input = '<div onclick="alert(1)" onmouseover="alert(2)">text</div>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("onclick");
      expect(result).not.toContain("onmouseover");
    });

    it("should remove handlers without quotes", () => {
      const input = '<div onclick=alert(1)>text</div>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("onclick");
    });
  });

  describe("javascript: URL Blocking", () => {
    it("should block javascript: URLs", () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeInput(input);

      expect(result).not.toContain("javascript:");
    });

    it("should block javascript: with spaces", () => {
      const input = 'javascript :alert(1)';
      const result = sanitizeInput(input);

      expect(result).not.toContain("javascript");
    });

    it("should block javascript: in href", () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("javascript:");
    });
  });

  describe("HTML Entity Escaping", () => {
    it("should escape < characters", () => {
      const input = "a < b";
      const result = sanitizeInput(input);

      expect(result).toBe("a &lt; b");
    });

    it("should escape > characters", () => {
      const input = "a > b";
      const result = sanitizeInput(input);

      expect(result).toBe("a &gt; b");
    });

    it("should escape double quotes", () => {
      const input = 'He said "hello"';
      const result = sanitizeInput(input);

      expect(result).toBe("He said &quot;hello&quot;");
    });

    it("should escape single quotes", () => {
      const input = "it's a test";
      const result = sanitizeInput(input);

      expect(result).toContain("&#x27;");
    });

    it("should escape all special HTML characters", () => {
      const input = '<div class="test">it\'s "valid"</div>';
      const result = sanitizeInput(input);

      expect(result).not.toContain("<div");
      expect(result).not.toContain("</div>");
      expect(result).not.toContain('"test"');
    });
  });

  describe("Null Byte Stripping", () => {
    it("should strip null bytes", () => {
      const input = "test\0value";
      const result = sanitizeInput(input);

      expect(result).toBe("testvalue");
      expect(result).not.toContain("\0");
    });

    it("should strip multiple null bytes", () => {
      const input = "a\0b\0c";
      const result = sanitizeInput(input);

      expect(result).toBe("abc");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = sanitizeInput("");

      expect(result).toBe("");
    });

    it("should handle non-string input", () => {
      const result = sanitizeInput(null as any);

      expect(result).toBe("");
    });

    it("should handle undefined input", () => {
      const result = sanitizeInput(undefined as any);

      expect(result).toBe("");
    });

    it("should preserve safe content", () => {
      const input = "Pizza Margherita - Classic Italian dish";
      const result = sanitizeInput(input);

      expect(result).toBe(input);
    });

    it("should handle string with only special characters", () => {
      const input = '<>"\'&';
      const result = sanitizeInput(input);

      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize all string values in object", () => {
      const input = {
        name: '<script>alert(1)</script>Pizza',
        description: 'Good <img src=x onerror=alert(1)>',
        price: 12.5,
      };

      const result = sanitizeObject(input);

      expect(result.name).not.toContain("<script>");
      expect(result.description).not.toContain("onerror");
      expect(result.price).toBe(12.5);
    });

    it("should handle empty object", () => {
      const result = sanitizeObject({});

      expect(result).toEqual({});
    });

    it("should preserve non-string values", () => {
      const input = {
        name: "test",
        count: 42,
        active: true,
        nested: { key: "value" },
      };

      const result = sanitizeObject(input);

      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.nested).toEqual({ key: "value" });
    });
  });
});
