"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CommunityFeed } from "@/components/community-mobile/CommunityFeed";

interface SocialMobileWrapperProps {
  currentUserId: string;
  currentUserName: string;
  currentUserImage: string | null;
  children: React.ReactNode;
}

export function SocialMobileWrapper({
  currentUserId,
  currentUserName,
  currentUserImage,
  children,
}: SocialMobileWrapperProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    check();

    // Delay hiding loader to prevent flash
    timerRef.current = setTimeout(() => setShowLoader(false), 100);

    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (isMobile === null || showLoader) {
    return <MobilePageLoading />;
  }

  if (isMobile) {
    return (
      <CommunityFeed
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
        isMobile={true}
      />
    );
  }

  return <>{children}</>;
}

function MobilePageLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
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
