import { describe, it, expect, vi, beforeEach } from "vitest";

interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  failedAttempts: number;
  isLocked: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

class AuthFlowPage {
  private state: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    failedAttempts: 0,
    isLocked: false,
  };

  private users: Map<string, { user: User; password: string }> = new Map();
  private lockoutThreshold = 5;
  private lockedEmails: Set<string> = new Set();

  constructor() {
    this.users.set("mario@example.com", {
      user: { id: "u1", email: "mario@example.com", name: "Mario Rossi", role: "customer" },
      password: "Mario123!",
    });
    this.users.set("admin@trattoria.it", {
      user: { id: "u2", email: "admin@trattoria.it", name: "Chef Giuseppe", role: "admin" },
      password: "Admin123!",
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email format" };
    }
    if (!password || password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
    if (!name || name.length < 2) {
      return { success: false, error: "Name must be at least 2 characters" };
    }
    if (this.users.has(email)) {
      return { success: false, error: "Email already registered" };
    }

    const user: User = {
      id: `u-${Date.now()}`,
      email,
      name,
      role: "customer",
    };

    this.users.set(email, { user, password });
    const token = `token-${Date.now()}`;
    const refreshToken = `refresh-${Date.now()}`;

    this.state.user = user;
    this.state.token = token;
    this.state.refreshToken = refreshToken;
    this.state.isAuthenticated = true;
    this.state.failedAttempts = 0;

    return { success: true, user, token, refreshToken };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    if (this.lockedEmails.has(email)) {
      return { success: false, error: "Account locked due to too many failed attempts" };
    }

    const record = this.users.get(email);
    if (!record || record.password !== password) {
      this.state.failedAttempts++;
      if (this.state.failedAttempts >= this.lockoutThreshold) {
        this.lockedEmails.add(email);
        this.state.isLocked = true;
        return { success: false, error: "Account locked due to too many failed attempts" };
      }
      return { success: false, error: "Invalid email or password" };
    }

    const token = `token-${Date.now()}`;
    const refreshToken = `refresh-${Date.now()}`;

    this.state.user = record.user;
    this.state.token = token;
    this.state.refreshToken = refreshToken;
    this.state.isAuthenticated = true;
    this.state.failedAttempts = 0;

    return { success: true, user: record.user, token, refreshToken };
  }

  async accessProtectedRoute(): Promise<{ success: boolean; data?: User; error?: string }> {
    if (!this.state.isAuthenticated || !this.state.token) {
      return { success: false, error: "Authentication required" };
    }
    return { success: true, data: this.state.user! };
  }

  async refreshToken(): Promise<AuthResponse> {
    if (!this.state.refreshToken) {
      return { success: false, error: "No refresh token" };
    }

    const newToken = `token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.state.token = newToken;

    return { success: true, token: newToken, user: this.state.user! };
  }

  async logout(): Promise<void> {
    this.state.user = null;
    this.state.token = null;
    this.state.refreshToken = null;
    this.state.isAuthenticated = false;
  }

  getState(): AuthState {
    return { ...this.state };
  }

  getFailedAttempts(): number {
    return this.state.failedAttempts;
  }
}

describe("Authentication Flow E2E", () => {
  let authPage: AuthFlowPage;

  beforeEach(() => {
    vi.clearAllMocks();
    authPage = new AuthFlowPage();
  });

  it("should register a new user successfully", async () => {
    const result = await authPage.register("new@example.com", "NewPass123!", "New User");

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe("new@example.com");
    expect(result.user!.name).toBe("New User");
    expect(result.user!.role).toBe("customer");
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("should reject registration with invalid email", async () => {
    const result = await authPage.register("not-an-email", "Password1!", "Test");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email format");
  });

  it("should reject registration with short password", async () => {
    const result = await authPage.register("test@example.com", "Ab1", "Test");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Password must be at least 8 characters");
  });

  it("should reject registration with short name", async () => {
    const result = await authPage.register("test@example.com", "Password1!", "A");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Name must be at least 2 characters");
  });

  it("should reject duplicate email registration", async () => {
    const result = await authPage.register("mario@example.com", "Mario123!", "Duplicate");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Email already registered");
  });

  it("should login with valid credentials", async () => {
    const result = await authPage.login("mario@example.com", "Mario123!");

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe("mario@example.com");
    expect(result.token).toBeDefined();

    const state = authPage.getState();
    expect(state.isAuthenticated).toBe(true);
  });

  it("should login as admin", async () => {
    const result = await authPage.login("admin@trattoria.it", "Admin123!");

    expect(result.success).toBe(true);
    expect(result.user!.role).toBe("admin");
  });

  it("should reject login with wrong password", async () => {
    const result = await authPage.login("mario@example.com", "WrongPassword!");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("should reject login with nonexistent email", async () => {
    const result = await authPage.login("nobody@example.com", "Password1!");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("should access protected route after login", async () => {
    await authPage.login("mario@example.com", "Mario123!");

    const result = await authPage.accessProtectedRoute();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.email).toBe("mario@example.com");
  });

  it("should reject protected route without authentication", async () => {
    const result = await authPage.accessProtectedRoute();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
  });

  it("should refresh token successfully", async () => {
    await authPage.login("mario@example.com", "Mario123!");
    const oldToken = authPage.getState().token;

    const result = await authPage.refreshToken();

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.token).not.toBe(oldToken);
  });

  it("should reject refresh without refresh token", async () => {
    const result = await authPage.refreshToken();

    expect(result.success).toBe(false);
    expect(result.error).toBe("No refresh token");
  });

  it("should logout successfully", async () => {
    await authPage.login("mario@example.com", "Mario123!");
    expect(authPage.getState().isAuthenticated).toBe(true);

    await authPage.logout();

    const state = authPage.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("should reject protected route after logout", async () => {
    await authPage.login("mario@example.com", "Mario123!");
    await authPage.logout();

    const result = await authPage.accessProtectedRoute();

    expect(result.success).toBe(false);
  });

  it("should lock account after multiple failed attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await authPage.login("mario@example.com", "WrongPassword!");
    }

    const result = await authPage.login("mario@example.com", "Mario123!");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Account locked due to too many failed attempts");
  });

  it("should track failed login attempts", async () => {
    await authPage.login("mario@example.com", "Wrong1!");
    await authPage.login("mario@example.com", "Wrong2!");

    expect(authPage.getFailedAttempts()).toBe(2);
  });

  it("should reset failed attempts after successful login", async () => {
    await authPage.login("mario@example.com", "Wrong1!");
    await authPage.login("mario@example.com", "Wrong2!");
    expect(authPage.getFailedAttempts()).toBe(2);

    await authPage.login("mario@example.com", "Mario123!");
    expect(authPage.getFailedAttempts()).toBe(0);
  });

  it("should complete full register-login-protect-logout flow", async () => {
    const regResult = await authPage.register("flow@test.com", "FlowTest1!", "Flow User");
    expect(regResult.success).toBe(true);

    await authPage.logout();

    const loginResult = await authPage.login("flow@test.com", "FlowTest1!");
    expect(loginResult.success).toBe(true);

    const protectedResult = await authPage.accessProtectedRoute();
    expect(protectedResult.success).toBe(true);

    await authPage.logout();
    expect(authPage.getState().isAuthenticated).toBe(false);
  });
});
