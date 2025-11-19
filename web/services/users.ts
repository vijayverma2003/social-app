import { AxiosError, AxiosResponse } from "axios";
import {
  OnboardingFormData,
  ProfileSettingsFormData,
  UserData,
} from "../../shared/schemas/user";
import api from "./api";

class UserService {
  static async getUser(token?: string): Promise<AxiosResponse<UserData>> {
    return api.get("/users/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  static async createUser(
    data: OnboardingFormData,
    token?: string
  ): Promise<AxiosResponse<UserData>> {
    return api.post("/users/create", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  static async updateUser(
    data: ProfileSettingsFormData,
    token?: string
  ): Promise<AxiosResponse<UserData>> {
    return api.put("/users/me", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  static async checkUserExists(token?: string): Promise<{
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
}

export default UserService;
