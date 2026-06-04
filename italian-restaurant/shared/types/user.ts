export enum UserRole {
  CUSTOMER = "customer",
  STAFF = "staff",
  ADMIN = "admin",
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: "Cliente",
  [UserRole.STAFF]: "Empleado",
  [UserRole.ADMIN]: "Administrador",
};

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, "passwordHash">;

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UpdateUserRoleDTO {
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedUsers {
  users: SafeUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Review {
  id: string;
  userId: string;
  user?: SafeUser;
  orderId: string | null;
  menuItemId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  isAnonymous: boolean;
  isApproved: boolean;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewDTO {
  orderId?: string;
  menuItemId?: string;
  rating: number;
  title?: string;
  comment?: string;
  isAnonymous?: boolean;
}

export interface UpdateReviewDTO {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReplyToReviewDTO {
  reply: string;
}
