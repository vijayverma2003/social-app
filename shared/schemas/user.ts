import { z } from "zod";

export const UserSchema = z.object({
  clerkId: z.string().trim(),
  email: z.email().trim().max(250),
  username: z.string().trim().min(3).max(50).optional(),
  discriminator: z.string().trim().max(4).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  avatarURL: z.url().optional(),
  bannerURL: z.url().optional(),
  bannerColor: z.string().trim().default("#000000"),
  bio: z.string().trim().default(""),
  pronouns: z.string().trim().default(""),
});

export const CreateUserSchema = UserSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSchema = UserSchema.partial().omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export const FindUserSchema = UserSchema.omit({
  clerkId: true,
  email: true,
});

export const OnboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge =
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ? age - 1
            : age;
        return actualAge >= 13;
      },
      { message: "You must be at least 13 years old" }
    ),
});

export type OnboardingFormData = z.infer<typeof OnboardingSchema>;
export type UserData = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
