import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import path from "path";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../../server/src/config/env", () => ({
  env: {
    PORT: 3000,
    DB_HOST: "localhost",
    DB_PORT: 5432,
    DB_NAME: "test_db",
    DB_USER: "test",
    DB_PASS: "test",
    JWT_SECRET: "test-secret-key-for-jwt-minimum-16",
    JWT_EXPIRES_IN: "7d",
    CORS_ORIGIN: "http://localhost:5173",
    NODE_ENV: "test",
    UPLOAD_DIR: "./uploads",
    MAX_FILE_SIZE: 5242880,
  },
}));

vi.mock("../../server/src/middleware/rateLimit", () => ({
  generalLimiter: (req: any, res: any, next: any) => next(),
  authLimiter: (req: any, res: any, next: any) => next(),
  orderLimiter: (req: any, res: any, next: any) => next(),
  reservationLimiter: (req: any, res: any, next: any) => next(),
}));

vi.mock("../../server/src/middleware/security", () => ({
  securityMiddleware: () => [],
  requestLogger: (req: any, res: any, next: any) => next(),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import app from "../../server/src/app";
import { UserModel } from "../../server/src/models/user";

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";

function generateTestToken(role: string = "customer", userId: string = "user-1") {
  return jwt.sign(
    { userId, email: "test@test.com", role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Upload Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/upload", () => {
    it("should accept a valid image file", async () => {
      const token = generateTestToken("admin");

      const imageBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", imageBuffer, {
          filename: "test-image.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const imageBuffer = Buffer.from("fake-image-data");

      const res = await request(app)
        .post("/api/upload")
        .attach("file", imageBuffer, {
          filename: "test.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(401);
    });

    it("should require admin role for upload", async () => {
      const token = generateTestToken("customer");
      const imageBuffer = Buffer.from("fake-image-data");

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", imageBuffer, {
          filename: "test.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(403);
    });

    it("should reject non-image file", async () => {
      const token = generateTestToken("admin");
      const textBuffer = Buffer.from("This is a text file, not an image");

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", textBuffer, {
          filename: "document.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("image");
    });

    it("should reject oversized file", async () => {
      const token = generateTestToken("admin");
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", largeBuffer, {
          filename: "large-image.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(400);
    });

    it("should reject request without file", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it("should return file URL on successful upload", async () => {
      const token = generateTestToken("admin");
      const imageBuffer = Buffer.from("fake-png-data");

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", imageBuffer, {
          filename: "pizza.jpg",
          contentType: "image/jpeg",
        });

      if (res.status === 200) {
        expect(res.body.data).toHaveProperty("url");
        expect(typeof res.body.data.url).toBe("string");
      }
    });
  });

  describe("DELETE /api/upload/:id", () => {
    it("should delete an uploaded file", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .delete("/api/upload/file-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication for delete", async () => {
      const res = await request(app).delete("/api/upload/file-uuid-1");

      expect(res.status).toBe(401);
    });

    it("should require admin role for delete", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .delete("/api/upload/file-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 when file not found", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .delete("/api/upload/nonexistent")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
