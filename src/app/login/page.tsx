import type { Metadata } from "next";
import LoginForm from "../../components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-white">Login</h1>
        <h2 className="mb-6 text-lg font-semibold text-white">This doesn't do anything</h2>
        <LoginForm />
      </div>
    </main>
  );
}


