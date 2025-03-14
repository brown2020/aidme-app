import dynamic from "next/dynamic";

const Listen = dynamic(() => import("@/components/Listen"), {
  loading: () => (
    <div className="flex items-center justify-center h-full w-full text-white">
      Loading...
    </div>
  ),
});

export default function Page() {
  return <Listen />;
}
