import {
  CreateUserSchema,
  UpdateUserProfileSchema,
} from "@shared/schemas/user";
import { UserWithProfile } from "@shared/types";
import { AxiosError, AxiosResponse } from "axios";
import api from "./api";

export async function getCurrentUser(
  token?: string
): Promise<AxiosResponse<UserWithProfile>> {
  return api.get("/users/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function createUser(
  data: CreateUserSchema,
  token?: string
): Promise<AxiosResponse<UserWithProfile>> {
  return api.post("/users/create", data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function updateUser(
  data: UpdateUserProfileSchema,
  token?: string
): Promise<AxiosResponse<UserWithProfile>> {
  return api.put("/users/me", data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function updateUserProfile(
  data: UpdateUserProfileSchema,
  token?: string
): Promise<AxiosResponse<UserWithProfile>> {
  return api.put("/users/me/profile", data, {
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
