import { AxiosError, AxiosResponse } from "axios";
import {
  CreateUserSchema,
  UpdateUserProfileSchema,
} from "@shared/schemas/user";
import api from "./api";
import { Profile, User } from "@database/postgres/generated/prisma/client";

export async function getCurrentUser(
  token?: string
): Promise<AxiosResponse<User & { profile: Profile }>> {
  return api.get("/users/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createUser(
  data: CreateUserSchema,
  token?: string
): Promise<AxiosResponse<CreateUserSchema>> {
  return api.post("/users/create", data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function updateUser(
  data: Profile,
  token?: string
): Promise<AxiosResponse<User & { profile: Profile }>> {
  return api.put("/users/me", data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function checkUserExists(token?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await api.get("/users/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { success: true };
  } catch (error) {
    if (
      (error instanceof AxiosError && error.response?.status === 401) ||
      (error instanceof AxiosError && error.response?.status === 404)
    )
      return { success: false };
    else
      return {
        success: false,
        error: "Internal server error while checking user exists",
      };
  }
}
