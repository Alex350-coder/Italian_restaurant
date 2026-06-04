import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { UserModel, User, SafeUser } from "../../server/src/models/user";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
}));

import { query } from "../../server/src/config/database";

const mockQuery = vi.mocked(query);

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1-uuid-test",
    email: "mario.rossi@example.com",
    password_hash: "$2a$12$hashedpasswordvalue",
    name: "Mario Rossi",
    phone: "+39 333 1234567",
    role: "customer",
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("UserModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a user with a hashed password and return SafeUser", async () => {
      const input = {
        email: "Mario.Rossi@Example.com",
        password: "Mario123!",
        name: "Mario Rossi",
        phone: "+39 333 1234567",
      };

      const createdUser = makeUser({
        email: "mario.rossi@example.com",
      });

      mockQuery.mockResolvedValueOnce({ rows: [createdUser], rowCount: 1, oid: 0, command: "INSERT" });

      const result = await UserModel.create(input);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("INSERT INTO users");
      expect(params[1]).toBe("mario.rossi@example.com");
      expect(params[4]).toBe("+39 333 1234567");
      expect(params[5]).toBe("customer");

      const passwordHash = params[2] as string;
      expect(passwordHash).not.toBe(input.password);
      expect(passwordHash.startsWith("$2a$")).toBe(true);
      const isMatch = await bcrypt.compare(input.password, passwordHash);
      expect(isMatch).toBe(true);

      expect(result).not.toHaveProperty("password_hash");
      expect(result.email).toBe("mario.rossi@example.com");
      expect(result.name).toBe("Mario Rossi");
    });

    it("should normalize email to lowercase", async () => {
      const input = {
        email: "UPPERCASE@EXAMPLE.COM",
        password: "Pass123!",
        name: "Upper User",
      };

      const createdUser = makeUser({ email: "uppercase@example.com" });
      mockQuery.mockResolvedValueOnce({ rows: [createdUser], rowCount: 1, oid: 0, command: "INSERT" });

      await UserModel.create(input);

      const params = mockQuery.mock.calls[0][1];
      expect(params[1]).toBe("uppercase@example.com");
    });

    it("should default role to customer", async () => {
      const input = {
        email: "test@example.com",
        password: "Pass123!",
        name: "Test User",
      };

      const createdUser = makeUser({ role: "customer" });
      mockQuery.mockResolvedValueOnce({ rows: [createdUser], rowCount: 1, oid: 0, command: "INSERT" });

      await UserModel.create(input);

      const params = mockQuery.mock.calls[0][1];
      expect(params[5]).toBe("customer");
    });

    it("should handle optional phone as null", async () => {
      const input = {
        email: "nophone@example.com",
        password: "Pass123!",
        name: "No Phone",
      };

      const createdUser = makeUser({ phone: null, email: "nophone@example.com" });
      mockQuery.mockResolvedValueOnce({ rows: [createdUser], rowCount: 1, oid: 0, command: "INSERT" });

      await UserModel.create(input);

      const params = mockQuery.mock.calls[0][1];
      expect(params[4]).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return the full User object including password_hash", async () => {
      const user = makeUser();
      mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1, oid: 0, command: "SELECT" });

      const result = await UserModel.findByEmail("mario.rossi@example.com");

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain("SELECT * FROM users WHERE email =");
      expect(mockQuery.mock.calls[0][1][0]).toBe("mario.rossi@example.com");
      expect(result).toEqual(user);
      expect(result?.password_hash).toBeDefined();
    });

    it("should normalize email to lowercase before querying", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, oid: 0, command: "SELECT" });

      await UserModel.findByEmail("Mario.Rossi@Example.COM");

      expect(mockQuery.mock.calls[0][1][0]).toBe("mario.rossi@example.com");
    });

    it("should return null when no user is found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, oid: 0, command: "SELECT" });

      const result = await UserModel.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return a SafeUser without password_hash", async () => {
      const user = makeUser();
      mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1, oid: 0, command: "SELECT" });

      const result = await UserModel.findById("u1-uuid-test");

      expect(result).not.toHaveProperty("password_hash");
      expect(result?.id).toBe("u1-uuid-test");
      expect(result?.email).toBe("mario.rossi@example.com");
    });

    it("should return null when no user is found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, oid: 0, command: "SELECT" });

      const result = await UserModel.findById("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("updatePassword", () => {
    it("should update password when current password is correct", async () => {
      const hashedPassword = await bcrypt.hash("OldPass123!", 12);
      const user = makeUser({ password_hash: hashedPassword });

      mockQuery
        .mockResolvedValueOnce({ rows: [user], rowCount: 1, oid: 0, command: "SELECT" })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, oid: 0, command: "UPDATE" });

      const result = await UserModel.updatePassword({
        userId: "u1-uuid-test",
        currentPassword: "OldPass123!",
        newPassword: "NewPass456!",
      });

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const updateParams = mockQuery.mock.calls[1][1] as any[];
      const newHash = updateParams[0] as string;
      expect(newHash.startsWith("$2a$")).toBe(true);
      const isNewHashValid = await bcrypt.compare("NewPass456!", newHash);
      expect(isNewHashValid).toBe(true);
    });

    it("should return false when current password is incorrect", async () => {
      const hashedPassword = await bcrypt.hash("CorrectPass123!", 12);
      const user = makeUser({ password_hash: hashedPassword });

      mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1, oid: 0, command: "SELECT" });

      const result = await UserModel.updatePassword({
        userId: "u1-uuid-test",
        currentPassword: "WrongPassword!",
        newPassword: "NewPass456!",
      });

      expect(result).toBe(false);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should return false when user does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, oid: 0, command: "SELECT" });

      const result = await UserModel.updatePassword({
        userId: "nonexistent-id",
        currentPassword: "OldPass123!",
        newPassword: "NewPass456!",
      });

      expect(result).toBe(false);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("verifyPassword", () => {
    it("should return the User when credentials are valid", async () => {
      const hashedPassword = await bcrypt.hash("Mario123!", 12);
      const user = makeUser({ password_hash: hashedPassword });

      mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1, oid: 0, command: "SELECT" });

      const result = await UserModel.verifyPassword("mario.rossi@example.com", "Mario123!");

      expect(result).not.toBeNull();
      expect(result?.email).toBe("mario.rossi@example.com");
    });

    it("should return null when email is not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, oid: 0, command: "SELECT" });

      const result = await UserModel.verifyPassword("nonexistent@example.com", "Pass123!");

      expect(result).toBeNull();
    });

    it("should return null when password is wrong", async () => {
      const hashedPassword = await bcrypt.hash("Mario123!", 12);
      const user = makeUser({ password_hash: hashedPassword });

      mockQuery.mockResolvedValueOnce({ rows: [user], rowCount: 1, oid: 0, command: "SELECT" });

      const result = await UserModel.verifyPassword("mario.rossi@example.com", "WrongPassword!");

      expect(result).toBeNull();
    });

    it("should normalize email to lowercase", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, oid: 0, command: "SELECT" });

      await UserModel.verifyPassword("MARIO@EXAMPLE.COM", "Pass123!");

      expect(mockQuery.mock.calls[0][1][0]).toBe("mario@example.com");
    });
  });

  describe("toSafeUser", () => {
    it("should strip password_hash from a User object", () => {
      const user = makeUser();
      const safe = UserModel.toSafeUser(user);

      expect(safe).not.toHaveProperty("password_hash");
      expect(safe.id).toBe(user.id);
      expect(safe.email).toBe(user.email);
      expect(safe.name).toBe(user.name);
      expect(safe.role).toBe(user.role);
    });

    it("should preserve all other fields", () => {
      const user = makeUser({
        id: "test-id",
        email: "test@test.com",
        name: "Test",
        phone: "123",
        role: "admin",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-06-01"),
      });

      const safe = UserModel.toSafeUser(user);

      expect(safe.id).toBe("test-id");
      expect(safe.email).toBe("test@test.com");
      expect(safe.name).toBe("Test");
      expect(safe.phone).toBe("123");
      expect(safe.role).toBe("admin");
      expect(safe.created_at).toEqual(new Date("2025-01-01"));
      expect(safe.updated_at).toEqual(new Date("2025-06-01"));
    });
  });

  describe("error handling", () => {
    it("should propagate database errors from create", async () => {
      mockQuery.mockRejectedValueOnce(new Error("duplicate key value violates unique constraint"));

      await expect(
        UserModel.create({
          email: "duplicate@example.com",
          password: "Pass123!",
          name: "Dup User",
        })
      ).rejects.toThrow("duplicate key value violates unique constraint");
    });

    it("should propagate database errors from findByEmail", async () => {
      mockQuery.mockRejectedValueOnce(new Error("connection refused"));

      await expect(UserModel.findByEmail("test@example.com")).rejects.toThrow("connection refused");
    });

    it("should propagate database errors from findById", async () => {
      mockQuery.mockRejectedValueOnce(new Error("connection refused"));

      await expect(UserModel.findById("some-id")).rejects.toThrow("connection refused");
    });
  });
});
