import { z } from "zod";

export const onboardingSchema = z.object({
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

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
