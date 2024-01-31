import Link from "next/link";

const items = [
  { title: "About", href: "/about" },
  { title: "Privacy", href: "/privacy" },
  { title: "Terms", href: "/terms" },
];

type Props = {};
export default function Footer({}: Props) {
  return (
    <div className="flex gap-2 items-center justify-center h-14">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:opacity-100 opacity-50"
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}
