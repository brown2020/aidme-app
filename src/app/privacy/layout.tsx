import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 h-container-custom w-full p-5 space-y-5 overflow-y-scroll">
      {children}
      <Footer />
    </div>
  );
}
