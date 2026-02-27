import z from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(64, "Password must be at most 64 characters."),
});

export type SignUpFormValues = z.infer<typeof SignUpSchema>;
