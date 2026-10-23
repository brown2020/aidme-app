import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import { FooterAuthLinks } from "./auth/FooterAuthLinks";

/**
 * Footer navigation component
 * Renders navigation links from constants
 */
export default function Footer() {
  return (
    <nav className="flex flex-wrap gap-x-3 gap-y-2 items-center justify-center min-h-14 shrink-0 py-2">
      {NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:opacity-100 opacity-50"
        >
          {item.title}
        </Link>
      ))}
      <FooterAuthLinks />
    </nav>
  );
}
