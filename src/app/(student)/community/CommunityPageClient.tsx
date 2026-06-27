"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommunityFeed } from "@/components/community-mobile/CommunityFeed";

interface CommunityPageClientProps {
  currentUserId: string;
  currentUserName: string;
  currentUserImage: string | null;
}

export function CommunityPageClient({
  currentUserId,
  currentUserName,
  currentUserImage,
}: CommunityPageClientProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        router.replace("/social");
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [router]);

  // Show loading state while checking (prevents layout flash)
  if (isMobile === null) return <MobilePageLoading />;

  // On desktop, redirect happens in useEffect - render nothing
  if (!isMobile) return null;

  return (
    <CommunityFeed
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserAvatarUrl={currentUserImage}
    />
  );
}

function MobilePageLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999, // z-max
        background: "var(--bg-primary, #0a0a0f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#8b66ff",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
