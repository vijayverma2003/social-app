"use client";

import UserService from "@/services/users";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, getToken } = useAuth();
  const router = useRouter();

  async function checkUserExists() {
    const token = await getToken();
    const result = await UserService.checkUserExists(token || undefined);
    if (result.error) {
      // TODO: Show error toast
    } else if (result.success) router.push("/home");
    else router.push("/onboarding");
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
