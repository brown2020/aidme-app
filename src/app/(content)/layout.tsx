import Footer from "@/components/Footer";
import BackToTranscriptLink from "@/components/BackToTranscriptLink";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-container w-full p-5 space-y-5 overflow-y-auto">
      <BackToTranscriptLink />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
