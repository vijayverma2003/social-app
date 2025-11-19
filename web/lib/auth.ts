import UserService from "@/services/users";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserData } from "../../shared/schemas/user";
import { AxiosError } from "axios";

/**
 * Gets the authenticated user for server components.
 * Handles authentication checks and redirects if user is not authenticated or doesn't exist.
 *
 * @returns The authenticated user data
 * @throws Redirects to "/" if not authenticated or unauthorized
 * @throws Redirects to "/onboarding" if user doesn't exist in database
 * @throws Redirects to "/" if there's a server error (to prevent infinite loops)
 */
export async function getAuthenticatedUser(): Promise<UserData> {
  const { userId, getToken, isAuthenticated } = await auth();

  if (!isAuthenticated || !userId) redirect("/");

  const token = await getToken();
  if (!token) redirect("/");

  try {
    const response = await UserService.getUser(token);
    return response.data;
  } catch (error) {
    console.error("Unexpected error fetching user:", error);

    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === 401) redirect("/");
      else if (status === 404) redirect("/onboarding");
      else redirect("/");
    }

    redirect("/");
  }
}
