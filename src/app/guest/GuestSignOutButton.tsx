"use client";

export function GuestSignOutButton() {
  return (
    <button
      type="button"
      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      onClick={async () => {
        await fetch("/api/v1/guest-quiz/session", { method: "DELETE" });
        window.location.href = "/guest/past-papers";
      }}
    >
      Change identity
    </button>
  );
}
