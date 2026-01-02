import {
  CreateUserPayloadSchema,
  UpdateUserPayloadSchema,
  UpdateUserProfilePayloadSchema,
  GetUserProfilesPayloadSchema,
} from "../schemas/users";
import { z } from "zod";

export type CreateUserSchema = z.infer<typeof CreateUserPayloadSchema>;
export type UpdateUserSchema = z.infer<typeof UpdateUserPayloadSchema>;
export type UpdateUserProfileSchema = z.infer<
  typeof UpdateUserProfilePayloadSchema
>;
export type GetUserProfilesPayload = z.infer<
  typeof GetUserProfilesPayloadSchema
>;
