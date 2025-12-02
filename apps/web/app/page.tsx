"use client";

import { Button } from "@/components/ui/button";
import UserService from "@/services/users";
import { useAuth, SignInButton, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function checkUserExists() {
      const token = await getToken();
      if (!token) return;

      const result = await UserService.checkUserExists(token);
      if (result.error) {
        // TODO: Show error toast
      } else if (result.success) router.push("/home");
      else router.push("/onboarding");
    }

    if (isLoaded) checkUserExists();
  }, [isLoaded, getToken, router]);

  return (
    <main className="flex h-screen items-center justify-center">
      <SignedOut>
        <SignInButton mode="modal">
          <Button>Login</Button>
        </SignInButton>
      </SignedOut>
    </main>
  );
}
