import {
  CreateUserPayloadSchema,
  UpdateUserPayloadSchema,
  UpdateUserProfilePayloadSchema,
  GetUserProfilesPayloadSchema,
} from "../schemas/users";
import { z } from "zod";

export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;
export type UpdateUserPayload = z.infer<typeof UpdateUserPayloadSchema>;
export type UpdateUserProfilePayload = z.infer<
  typeof UpdateUserProfilePayloadSchema
>;
export type GetUserProfilesPayload = z.infer<
  typeof GetUserProfilesPayloadSchema
>;
