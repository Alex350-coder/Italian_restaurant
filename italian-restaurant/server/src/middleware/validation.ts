import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const cleanedErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(fieldErrors)) {
        if (value) cleanedErrors[key] = value;
      }
      const err = new ValidationError("Validation failed", cleanedErrors);
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        errorCode: err.errorCode,
        details: err.details,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;
    next();
  };
}

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

export const strictEmailRegex =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const phoneRegex =
  /^\+?1?\d{9,15}$|^\(\d{3}\)\s?\d{3}-?\d{4}$/;

export const passwordValidation = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(
    /[A-Z]/,
    "Password must contain at least one uppercase letter"
  )
  .regex(
    /[a-z]/,
    "Password must contain at least one lowercase letter"
  )
  .regex(
    /\d/,
    "Password must contain at least one number"
  )
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character"
  );

export const emailValidation = z
  .string()
  .email("Invalid email address")
  .max(254, "Email must be at most 254 characters")
  .refine(
    (email) => strictEmailRegex.test(email),
    "Invalid email format"
  );

export const phoneValidation = z
  .string()
  .refine(
    (phone) => phoneRegex.test(phone.replace(/[\s\-\(\)]/g, "")),
    "Invalid phone number format"
  )
  .optional();

export const creditCardValidation = z
  .string()
  .refine(
    (card) => /^\d{13,19}$/.test(card.replace(/\s/g, "")),
    "Card number must be 13-19 digits"
  )
  .refine(
    (card) => luhnCheck(card),
    "Invalid card number"
  );

export const uuidValidation = z
  .string()
  .uuid("Invalid UUID format");

export const dateValidation = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

export const timeValidation = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format");

export const paginationQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Math.max(1, parseInt(val || "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => Math.min(100, Math.max(1, parseInt(val || "20", 10) || 20))),
});

export const registerSchema = z.object({
  body: z.object({
    email: emailValidation,
    password: passwordValidation,
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    phone: phoneValidation,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          menu_item_id: z.string().uuid("Invalid menu item ID"),
          quantity: z.number().int().positive("Quantity must be positive"),
        })
      )
      .min(1, "Order must contain at least one item"),
    notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
  }),
});

export const createReservationSchema = z.object({
  body: z.object({
    reservation_date: dateValidation.refine(
      (date) => {
        const d = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      },
      "Reservation date must be today or in the future"
    ),
    reservation_time: timeValidation,
    party_size: z
      .number()
      .int()
      .min(1, "Party size must be at least 1")
      .max(20, "Maximum party size is 20"),
    name: z.string().min(1, "Name is required").max(100),
    phone: z.string().min(1, "Phone is required"),
    email: emailValidation,
    notes: z.string().max(500).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: uuidValidation,
  }),
  body: z.object({
    status: z.enum([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
    ]),
  }),
});

export const menuItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().min(1, "Description is required").max(1000),
    price: z.number().positive("Price must be positive"),
    category: z.string().min(1, "Category is required").max(100),
    image_url: z.string().url("Invalid URL").optional(),
    is_available: z.boolean().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordValidation,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: emailValidation.optional(),
    phone: phoneValidation,
  }),
});

export const paymentSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
    currency: z
      .string()
      .length(3, "Currency must be 3 characters")
      .default("USD"),
    cardNumber: creditCardValidation,
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(new Date().getFullYear()),
    cvc: z.string().regex(/^\d{3,4}$/, "CVC must be 3-4 digits"),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: uuidValidation,
  }),
});

export const slugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1).max(200),
  }),
});
