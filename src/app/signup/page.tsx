import type { Metadata } from "next";
import SignupForm from "../../components/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-white">Create account</h1>
        <SignupForm />
      </div>
    </main>
  );
}


