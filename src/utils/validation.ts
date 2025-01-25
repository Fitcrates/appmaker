import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(50),
});

// Feedback validation schema
export const feedbackSchema = z.object({
  anime_id: z.number().int().positive(),
  user_id: z.string().uuid(),
  rating: z.number().min(0).max(10).multipleOf(0.1),
});

// Auth validation schemas
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  name: z.string().min(2).max(50),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Validation functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Invalid input' };
  }
};
