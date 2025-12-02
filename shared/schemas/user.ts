import z from "zod";

const validateAge = (date: Date) => {
  const today = new Date();
  const birthDate = new Date(date);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;
  return actualAge >= 13;
};

export const createUserSchema = z.object({
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
  dob: z.date().refine(validateAge, {
    message: "You must be at least 13 years old",
  }),
});

export const updateUserSchema = z
  .object({
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
    dob: z
      .date()
      .refine(validateAge, { message: "You must be at least 13 years old" })
      .optional(),
  })
  .strict();

export const updateUserProfileSchema = z
  .object({
    displayName: z.string().trim().max(100).optional().or(z.literal("")),
    avatarURL: z.url("Invalid avatar URL").optional().or(z.literal("")),
    bannerURL: z.url("Invalid banner URL").optional().or(z.literal("")),
    bannerColor: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color code")
      .optional()
      .or(z.literal("")),
    bio: z.string().trim().max(400).optional().or(z.literal("")),
    pronouns: z.string().trim().max(20).optional().or(z.literal("")),
    profileGradientStart: z.string().optional().or(z.literal("")),
    profileGradientEnd: z.string().optional().or(z.literal("")),
  })
  .strict();

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type UpdateUserProfileSchema = z.infer<typeof updateUserProfileSchema>;
