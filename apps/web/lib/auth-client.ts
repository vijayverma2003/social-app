import { createAuthClient } from "better-auth/client";

const apiBaseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: `${apiBaseURL}/v1/auth`,
  fetchOptions: {
    credentials: "include",
  },
});

export async function signUp(params: {
  name: string;
  email: string;
  password: string;
}) {
  return authClient.signUp.email(
    {
      ...params,
      callbackURL:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
    {
      onError: (error) => {
        console.error(error);
      },
    },
  );
}
