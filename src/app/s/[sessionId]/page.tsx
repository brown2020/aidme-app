import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LiveViewer from "@/components/live/LiveViewer";
import { sessionIdSchema } from "@/lib/liveSessionModel";

export const metadata: Metadata = {
  title: "Live captions · Aid.me",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  if (!sessionIdSchema.safeParse(sessionId).success) notFound();
  return <LiveViewer sessionId={sessionId} />;
}
