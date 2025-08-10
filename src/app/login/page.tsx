import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "../../components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-white">Login</h1>
        <LoginForm />
        <p className="mt-6 text-sm text-gray-300">
          Don’t have an account yet?{' '}
          <Link href="/signup" className="text-white underline hover:no-underline">Sign up now</Link>
        </p>
      </div>
    </main>
  );
}


