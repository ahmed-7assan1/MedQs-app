import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  SquarePen,
  Image as ImageIcon,
  Zap,
  Grid3x3,
  FolderClosed,
  History,
  Trash2,
  ChevronsLeft,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { loadThreads, deleteThread, type Thread } from "@/lib/threads";
import { GrokLogo } from "./grok-logo";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [expanded, setExpanded] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    setThreads(loadThreads());
    const onStorage = () => setThreads(loadThreads());
    window.addEventListener("storage", onStorage);
    window.addEventListener("threads-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("threads-updated", onStorage);
    };
  }, [currentPath]);

  const icons = [
    { icon: Search, label: "Search", onClick: () => setExpanded(true) },
    { icon: SquarePen, label: "New Chat", to: "/" },
    { icon: ImageIcon, label: "Imagine" },
    { icon: Zap, label: "Automations" },
    { icon: Grid3x3, label: "Skills" },
    { icon: FolderClosed, label: "Projects" },
    { icon: History, label: "History", onClick: () => setExpanded(true) },
  ];

  return (
    <aside
      className={cn(
        "group flex h-screen shrink-0 flex-col border-s border-sidebar-border bg-sidebar transition-all duration-200",
        expanded ? "w-64" : "w-14",
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <Link to="/" className="flex items-center gap-2">
          <GrokLogo className="h-6 w-6" />
          {expanded && <span className="text-sm font-semibold">Grok</span>}
        </Link>
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent"
            aria-label="Collapse"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {icons.map(({ icon: Icon, label, to, onClick }) => {
          const inner = (
            <>
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="text-sm">{label}</span>}
            </>
          );
          const cls =
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sidebar-foreground hover:bg-sidebar-accent";
          if (to) {
            return (
              <Link key={label} to={to} className={cls}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={label} onClick={onClick} className={cls + " text-start"}>
              {inner}
            </button>
          );
        })}
      </nav>

      {expanded && (
        <div className="mt-4 flex-1 overflow-y-auto px-2">
          <div className="px-2 pb-2 text-xs font-medium text-muted-foreground">
            History
          </div>
          {threads.length === 0 ? (
            <div className="px-2 py-4 text-xs text-muted-foreground">
              No chats yet
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {threads.map((t) => {
                const active = currentPath === `/${t.id}`;
                return (
                  <li key={t.id} className="group/item flex items-center gap-1">
                    <Link
                      to="/$threadId"
                      params={{ threadId: t.id }}
                      className={cn(
                        "flex-1 truncate rounded-md px-2 py-1.5 text-sm",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent",
                      )}
                    >
                      {t.title}
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        deleteThread(t.id);
                        window.dispatchEvent(new Event("threads-updated"));
                        if (active) navigate({ to: "/" });
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-sidebar-accent group-hover/item:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border px-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
          <User className="h-4 w-4" />
        </div>
        {expanded && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">Guest</div>
          </div>
        )}
      </div>
    </aside>
  );
}