"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();

  const router = useRouter();

  console.log(isLoaded, user);

  async function checkUserExists() {
    const token = await getToken();
    if (!token) return;

    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data) router.push("/home");
    } catch (error) {
      console.log(error, (error as AxiosError).response?.status);
      if (error instanceof AxiosError && error.response?.status === 401) return;
      else router.push("/onboarding");
    }
  }

  useEffect(() => {
    if (isLoaded) checkUserExists();
  }, [isLoaded]);

  return (
    <main className="flex h-screen items-center justify-center">
      Hello World
    </main>
  );
}
