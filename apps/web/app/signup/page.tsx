import { SignUpForm } from "@/app/signup/components/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-semibold">Create an account</h1>
        <SignUpForm />
      </div>
    </main>
  );
}
