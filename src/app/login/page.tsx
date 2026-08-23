import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-ink-50 to-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 font-display text-lg font-bold text-white shadow-pop">
            D
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Digbys BOH</h1>
          <p className="mt-1 text-sm text-ink-400">Sign in to see your schedule</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
