import { z } from "zod";

const validateAge = (date: string) => {
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;
  return actualAge >= 13;
};

export const UserSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required").trim(),
  email: z
    .email("Invalid email address")
    .min(1, "Email is required")
    .trim()
    .max(250, "Email cannot exceed 250 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional(),
  discriminator: z
    .string()
    .trim()
    .max(4, "Discriminator cannot exceed 4 characters")
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  avatarURL: z.url("Invalid avatar URL").optional(),
  bannerURL: z.url("Invalid banner URL").optional(),
  bannerColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color code")
    .default("#000000"),
  bio: z
    .string()
    .trim()
    .max(400, "Bio cannot exceed 400 characters")
    .default(""),
  pronouns: z
    .string()
    .trim()
    .max(20, "Pronouns cannot exceed 20 characters")
    .default(""),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine(validateAge, { message: "You must be at least 13 years old" })
    .optional(),
});

export const CreateUserSchema = UserSchema.omit({
  createdAt: true,
  updatedAt: true,
}).strict();

export const UpdateUserSchema = UserSchema.partial()
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();

export const FindUserSchema = UserSchema.omit({
  clerkId: true,
  email: true,
  dob: true,
});

export const OnboardingSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    dob: z
      .string()
      .min(1, "Date of birth is required")
      .refine(validateAge, { message: "You must be at least 13 years old" }),
  })
  .strict();

export const ProfileSettingsSchema = z
  .object({
    bio: UserSchema.shape.bio,
    pronouns: UserSchema.shape.pronouns,
    bannerColor: UserSchema.shape.bannerColor,
    avatarURL: z
      .union([z.string().url("Invalid avatar URL"), z.literal("")])
      .optional(),
    bannerURL: z
      .union([z.string().url("Invalid banner URL"), z.literal("")])
      .optional(),
  })
  .strict();

export type ProfileSettingsFormData = z.infer<typeof ProfileSettingsSchema>;
export type OnboardingFormData = z.infer<typeof OnboardingSchema>;
export type UserData = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
export type FindUserData = z.infer<typeof FindUserSchema>;
