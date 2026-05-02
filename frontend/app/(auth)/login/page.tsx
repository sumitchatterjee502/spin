"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Button from "@/components/Slice/UI/Button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    await signIn("credentials", {
      email: username,
      password,
      callbackUrl: "/dashboards",
    });

    setIsSubmitting(false);
  }

  return (
    <section className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 md:grid-cols-2">
        <div className="bg-slate-900 p-6 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            Admin Access
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
            Welcome Back
          </h1>
          <p className="mt-4 text-sm text-slate-200 sm:text-base">
            Sign in with your account to continue to the admin dashboard.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Login
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your username and password.
          </p>

          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleLogin}>
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
              {isSubmitting ? "Signing in..." : "Submit"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
