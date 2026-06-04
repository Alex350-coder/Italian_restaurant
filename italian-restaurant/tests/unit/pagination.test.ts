import { describe, it, expect } from "vitest";

interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
  const maxLimit = 100;
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit || "20", 10) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

function paginateArray<T>(array: T[], page: number, limit: number): T[] {
  const offset = (page - 1) * limit;
  return array.slice(offset, offset + limit);
}

describe("Pagination", () => {
  describe("parsePagination", () => {
    it("should extract correct values from valid input", () => {
      const result = parsePagination({ page: "3", limit: "10" });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it("should apply default values when not provided", () => {
      const result = parsePagination({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it("should enforce max limit of 100", () => {
      const result = parsePagination({ page: "1", limit: "200" });

      expect(result.limit).toBe(100);
    });

    it("should enforce minimum limit of 1", () => {
      const result = parsePagination({ page: "1", limit: "-1" });

      expect(result.limit).toBe(1);
    });

    it("should enforce minimum page of 1", () => {
      const result = parsePagination({ page: "-5", limit: "10" });

      expect(result.page).toBe(1);
    });

    it("should handle non-numeric strings", () => {
      const result = parsePagination({ page: "abc", limit: "xyz" });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should handle empty strings", () => {
      const result = parsePagination({ page: "", limit: "" });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should calculate offset correctly for page 1", () => {
      const result = parsePagination({ page: "1", limit: "10" });

      expect(result.offset).toBe(0);
    });

    it("should calculate offset correctly for page 5", () => {
      const result = parsePagination({ page: "5", limit: "10" });

      expect(result.offset).toBe(40);
    });

    it("should handle decimal values by truncating", () => {
      const result = parsePagination({ page: "2.5", limit: "10.9" });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe("buildPaginationMeta", () => {
    it("should build correct metadata", () => {
      const meta = buildPaginationMeta(1, 10, 50);

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(50);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it("should set hasNext to false on last page", () => {
      const meta = buildPaginationMeta(5, 10, 50);

      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it("should set hasPrev to false on first page", () => {
      const meta = buildPaginationMeta(1, 10, 50);

      expect(meta.hasPrev).toBe(false);
    });

    it("should handle total less than limit", () => {
      const meta = buildPaginationMeta(1, 10, 3);

      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it("should handle zero total", () => {
      const meta = buildPaginationMeta(1, 10, 0);

      expect(meta.totalPages).toBe(0);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it("should calculate totalPages correctly with remainder", () => {
      const meta = buildPaginationMeta(1, 10, 25);

      expect(meta.totalPages).toBe(3);
    });

    it("should handle single page of results", () => {
      const meta = buildPaginationMeta(1, 20, 15);

      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });
  });

  describe("paginateArray", () => {
    const items = Array.from({ length: 50 }, (_, i) => `item-${i}`);

    it("should return first page of results", () => {
      const result = paginateArray(items, 1, 10);

      expect(result).toHaveLength(10);
      expect(result[0]).toBe("item-0");
      expect(result[9]).toBe("item-9");
    });

    it("should return second page of results", () => {
      const result = paginateArray(items, 2, 10);

      expect(result).toHaveLength(10);
      expect(result[0]).toBe("item-10");
    });

    it("should return partial last page", () => {
      const result = paginateArray(items, 5, 10);

      expect(result).toHaveLength(10);
    });

    it("should return empty array for out-of-range page", () => {
      const result = paginateArray(items, 100, 10);

      expect(result).toHaveLength(0);
    });

    it("should handle empty array", () => {
      const result = paginateArray([], 1, 10);

      expect(result).toHaveLength(0);
    });

    it("should handle limit larger than array", () => {
      const result = paginateArray(items, 1, 100);

      expect(result).toHaveLength(50);
    });

    it("should handle limit of 1", () => {
      const result = paginateArray(items, 1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe("item-0");
    });
  });
});
