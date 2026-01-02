"use client";

import { Button } from "@/components/ui/button";
import { checkUserExists } from "@/services/users";
import { useAuth, SignInButton, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, getToken } = useAuth();
  const router = useRouter();

  const userExists = async () => {
    const token = await getToken();
    if (!token) return;

    const result = await checkUserExists(token);
    if (result.error) {
      // TODO: Show error toast
    } else if (result.success) router.push("/home");
    else router.push("/onboarding");
  };

  useEffect(() => {
    if (isLoaded) userExists();
  }, [isLoaded]);

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
