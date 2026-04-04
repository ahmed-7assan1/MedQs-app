/** Dedicated layout so the `profile` segment is a stable tree for Next.js (avoids dev/HMR issues with route groups). */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
