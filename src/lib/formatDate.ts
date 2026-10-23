/** e.g. "October 9, 2026, 3:05 PM" in the user's locale */
export function formatSessionDate(date: Date | null): string {
  if (!date) return "Just now";
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
