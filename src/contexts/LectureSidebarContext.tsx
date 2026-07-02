"use client";
import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import dynamic from "next/dynamic";

const MedOneXChat = dynamic(() => import("@/components/ai/MedOneXChat").then(m => m.MedOneXChat), {
  loading: () => <div className="h-full w-full animate-pulse bg-white/5" />,
  ssr: false,
});

interface LectureSidebarState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  lectureId: string | null;
  lectureTitle: string | null;
  lectureContent: string | null;
  selectedText: string;
  activeSection: string | null;
  openSidebar: (id: string, title: string, content?: string | null) => void;
  closeSidebar: () => void;
  setSelectedText: (text: string) => void;
  clearSelectedText: () => void;
  setActiveSection: (section: string | null) => void;
}

const LectureSidebarContext = createContext<LectureSidebarState | null>(null);

const MIN_WIDTH = 200;
const MAX_WIDTH = 800;

export function LectureSidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [lectureId, setLectureId] = useState<string | null>(null);
  const [lectureTitle, setLectureTitle] = useState<string | null>(null);
  const [lectureContent, setLectureContent] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const openSidebar = useCallback((id: string, title: string, content?: string | null) => {
    setLectureId(id);
    setLectureTitle(title);
    setLectureContent(content ?? null);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedText("");
  }, []);

  const clearSelectedText = useCallback(() => {
    setSelectedText("");
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    resizingRef.current = true;
    startXRef.current = clientX;
    startWidthRef.current = sidebarWidth;
    e.preventDefault();
  }, [sidebarWidth]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!resizingRef.current) return;
      const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const delta = startXRef.current - clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      resizingRef.current = false;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onMouseMove, { passive: true });
    document.addEventListener("touchend", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onMouseMove);
      document.removeEventListener("touchend", onMouseUp);
    };
  }, [sidebarOpen]);

  return (
    <LectureSidebarContext.Provider
      value={{
        sidebarOpen,
        sidebarWidth,
        lectureId,
        lectureTitle,
        lectureContent,
        selectedText,
        activeSection,
        openSidebar,
        closeSidebar,
        setSelectedText,
        clearSelectedText,
        setActiveSection,
      }}
    >
      {children}

      {sidebarOpen && (
        <div
          className="fixed right-0 inset-y-0 z-50 flex flex-col overflow-hidden shadow-2xl border-l border-white/10 bg-[#09090b] select-none"
          style={{ width: sidebarWidth }}
        >
          <div
            className="absolute left-0 inset-y-0 w-1.5 cursor-ew-resize z-10 hover:bg-white/20 active:bg-white/30 transition-colors"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          />
          <MedOneXChat
            embedded
            lectureId={lectureId ?? undefined}
            lectureTitle={lectureTitle ?? undefined}
            lectureContent={lectureContent ?? undefined}
            selectedText={selectedText}
            activeSection={activeSection ?? undefined}
            onClose={closeSidebar}
            onClearSelectedText={clearSelectedText}
          />
        </div>
      )}
    </LectureSidebarContext.Provider>
  );
}

export function useLectureSidebar() {
  const ctx = useContext(LectureSidebarContext);
  if (!ctx) throw new Error("useLectureSidebar must be used within LectureSidebarProvider");
  return ctx;
}
