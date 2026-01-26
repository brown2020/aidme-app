import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

/**
 * Footer navigation component
 * Renders navigation links from constants
 */
export default function Footer() {
  return (
    <nav className="flex gap-2 items-center justify-center h-14 shrink-0">
      {NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:opacity-100 opacity-50"
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
