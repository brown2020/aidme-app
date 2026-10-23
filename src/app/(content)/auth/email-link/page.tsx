import { Suspense } from "react";
import type { Metadata } from "next";
import EmailLinkCompletePage from "@/components/auth/EmailLinkCompletePage";

export const metadata: Metadata = {
  title: "Signing in · Aid.me",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <EmailLinkCompletePage />
    </Suspense>
  );
}
