import { Suspense } from "react";
import type { Metadata } from "next";
import SignInPage from "@/components/auth/SignInPage";

export const metadata: Metadata = {
  title: "Sign in · Aid.me",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
