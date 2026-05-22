"use client";

import { Clock, CheckCircle, XCircle } from "@phosphor-icons/react";

interface Props {
  userId: string;
  name: string;
  image?: string;
  focusSeconds: number;
  sessionsCompleted: number;
  isOnline: boolean;
  isHost?: boolean;
  showKick?: boolean;
  onKick?: (userId: string) => void;
}

export default function SessionParticipantCard({
  userId, name, image, focusSeconds, sessionsCompleted, isOnline, isHost, showKick, onKick,
}: Props) {
  const fmtFocus = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      {image ? (
        <img src={image} alt="" className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
          {isHost && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">Host</span>}
          {isOnline && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Online" />}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {fmtFocus(focusSeconds)}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle size={12} />
            {sessionsCompleted} sessions
          </span>
        </div>
      </div>
      {showKick && onKick && (
        <button
          onClick={() => onKick(userId)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Remove from session"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}
