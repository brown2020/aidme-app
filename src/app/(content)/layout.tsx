import Footer from "@/components/Footer";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 h-container w-full p-5 space-y-5 overflow-y-scroll">
      {children}
      <Footer />
    </div>
  );
}
