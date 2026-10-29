import Image from "next/image";
import { allowedProfilePhotoUrl } from "@/lib/profilePhoto";
import type { AuthUser } from "@/zustand/useAuthStore";

function initials(user: AuthUser): string {
  const source = user.displayName || user.email || "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Google profile photo when available, otherwise initials */
export function UserAvatar({ user, size = 32 }: { user: AuthUser; size?: number }) {
  const photoURL = allowedProfilePhotoUrl(user.photoURL);
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt=""
        width={size}
        height={size}
        className="rounded-full"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
    >
      {initials(user)}
    </span>
  );
}
