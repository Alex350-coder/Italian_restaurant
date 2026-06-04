import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: "customer" | "admin";
  created_at: Date;
  updated_at: Date;
}

export interface SafeUser extends Omit<User, "password_hash"> {}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UpdatePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

const SALT_ROUNDS = 12;

function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

export const UserModel = {
  async findById(id: string): Promise<SafeUser | null> {
    const result = await query<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    const user = result.rows[0];
    return user ? toSafeUser(user) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async create(input: CreateUserInput): Promise<SafeUser> {
    const id = uuidv4();
    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const now = new Date();

    const result = await query<User>(
      `INSERT INTO users (id, email, password_hash, name, phone, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        input.email.toLowerCase(),
        password_hash,
        input.name,
        input.phone || null,
        "customer",
        now,
        now,
      ]
    );

    return toSafeUser(result.rows[0]);
  },

  async updatePassword(input: UpdatePasswordInput): Promise<boolean> {
    const user = await query<User>(
      "SELECT * FROM users WHERE id = $1",
      [input.userId]
    );

    if (!user.rows[0]) {
      return false;
    }

    const validPassword = await bcrypt.compare(
      input.currentPassword,
      user.rows[0].password_hash
    );

    if (!validPassword) {
      return false;
    }

    const newHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    await query(
      "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3",
      [newHash, new Date(), input.userId]
    );

    return true;
  },

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (!user.rows[0]) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.rows[0].password_hash);
    return valid ? user.rows[0] : null;
  },

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ): Promise<SafeUser | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email.toLowerCase());
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = $${idx++}`);
    values.push(new Date());

    values.push(userId);
    const result = await query<User>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    return result.rows[0] ? toSafeUser(result.rows[0]) : null;
  },

  toSafeUser,
};
