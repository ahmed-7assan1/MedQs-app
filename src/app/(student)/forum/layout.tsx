/**
 * Forum routes need a flex column that can grow so the Discussions chat fills the viewport.
 */
export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
