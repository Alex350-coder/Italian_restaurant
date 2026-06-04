import { describe, it, expect } from "vitest";

function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | string, format: string = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "Invalid date";
  }

  switch (format) {
    case "short":
      return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    case "long":
      return d.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "time":
      return d.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "datetime":
      return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return d.toLocaleDateString("it-IT");
  }
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 0) return "just now";
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? "s" : ""} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? "s" : ""} ago`;
}

function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

describe("Formatting Utilities", () => {
  describe("formatCurrency", () => {
    it("should format amount in EUR by default", () => {
      const result = formatCurrency(12.5);

      expect(result).toContain("12,50");
      expect(result).toContain("€");
    });

    it("should format whole numbers with decimals", () => {
      const result = formatCurrency(100);

      expect(result).toContain("100,00");
    });

    it("should format zero correctly", () => {
      const result = formatCurrency(0);

      expect(result).toContain("0,00");
    });

    it("should format large amounts", () => {
      const result = formatCurrency(1234567.89);

      expect(result).toContain("1234567");
      expect(result).toContain("89");
    });

    it("should format negative amounts", () => {
      const result = formatCurrency(-25.5);

      expect(result).toContain("25");
      expect(result).toContain("50");
    });

    it("should format with USD currency", () => {
      const result = formatCurrency(12.5, "USD");

      expect(result).toContain("12");
      expect(result).toContain("50");
    });

    it("should format with GBP currency", () => {
      const result = formatCurrency(12.5, "GBP");

      expect(result).toContain("12,50");
      expect(result).toContain("£");
    });
  });

  describe("formatDate", () => {
    const testDate = new Date("2026-06-15T14:30:00Z");

    it("should format short date correctly", () => {
      const result = formatDate(testDate, "short");

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format long date correctly", () => {
      const result = formatDate(testDate, "long");

      expect(result).toContain("2026");
      expect(result).toMatch(/\d{1,2}\s\w+\s\d{4}/);
    });

    it("should format time correctly", () => {
      const result = formatDate(testDate, "time");

      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should format datetime correctly", () => {
      const result = formatDate(testDate, "datetime");

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should accept date string input", () => {
      const result = formatDate("2026-06-15", "short");

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should return Invalid date for invalid input", () => {
      const result = formatDate("not-a-date");

      expect(result).toBe("Invalid date");
    });

    it("should use default format when not specified", () => {
      const result = formatDate(testDate);

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("formatRelativeTime", () => {
    it("should return 'just now' for recent time", () => {
      const now = new Date();
      const result = formatRelativeTime(now);

      expect(result).toBe("just now");
    });

    it("should return minutes ago", () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toBe("5 minutes ago");
    });

    it("should return singular minute", () => {
      const date = new Date(Date.now() - 1 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toBe("1 minute ago");
    });

    it("should return hours ago", () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toBe("3 hours ago");
    });

    it("should return singular hour", () => {
      const date = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toBe("1 hour ago");
    });

    it("should return days ago", () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toBe("5 days ago");
    });

    it("should return weeks ago", () => {
      const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toBe("2 weeks ago");
    });

    it("should return months ago", () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);

      expect(result).toContain("month");
    });

    it("should accept date string input", () => {
      const dateStr = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(dateStr);

      expect(result).toBe("1 hour ago");
    });
  });

  describe("truncateText", () => {
    it("should truncate long text", () => {
      const text = "This is a very long description that needs to be truncated";
      const result = truncateText(text, 30);

      expect(result.length).toBeLessThanOrEqual(30);
      expect(result).toContain("...");
    });

    it("should not truncate short text", () => {
      const text = "Short";
      const result = truncateText(text, 30);

      expect(result).toBe("Short");
    });

    it("should use custom suffix", () => {
      const text = "Long text here";
      const result = truncateText(text, 10, "…");

      expect(result).toContain("…");
    });

    it("should handle empty string", () => {
      const result = truncateText("", 10);

      expect(result).toBe("");
    });

    it("should handle null input", () => {
      const result = truncateText(null as any, 10);

      expect(result).toBe("");
    });

    it("should handle exact maxLength", () => {
      const text = "12345";
      const result = truncateText(text, 5);

      expect(result).toBe("12345");
    });

    it("should truncate to correct length", () => {
      const text = "abcdefghij";
      const result = truncateText(text, 7);

      expect(result.length).toBeLessThanOrEqual(7);
      expect(result).toBe("abcd...");
    });
  });

  describe("capitalizeFirst", () => {
    it("should capitalize first letter", () => {
      expect(capitalizeFirst("hello")).toBe("Hello");
    });

    it("should handle already capitalized", () => {
      expect(capitalizeFirst("Hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(capitalizeFirst("")).toBe("");
    });

    it("should handle single character", () => {
      expect(capitalizeFirst("a")).toBe("A");
    });

    it("should handle null input", () => {
      expect(capitalizeFirst(null as any)).toBe("");
    });
  });

  describe("slugify", () => {
    it("should convert to lowercase slug", () => {
      expect(slugify("Pizza Margherita")).toBe("pizza-margherita");
    });

    it("should replace spaces with hyphens", () => {
      expect(slugify("Spaghetti Carbonara")).toBe("spaghetti-carbonara");
    });

    it("should remove special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("too   many   spaces")).toBe("too-many-spaces");
    });

    it("should trim leading/trailing hyphens", () => {
      expect(slugify(" hello ")).toBe("hello");
    });

    it("should handle empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("should handle all special characters", () => {
      expect(slugify("!@#$%^&*()")).toBe("");
    });
  });
});
