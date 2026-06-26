import { Brain, Layers, Target, BookOpen, MessageSquare, Clock } from "lucide-react";

export const FEATURES = [
  { icon: Brain, color: "#00FF88" },
  { icon: Layers, color: "#00D4FF" },
  { icon: Target, color: "#7C3AED" },
  { icon: BookOpen, color: "#F59E0B" },
  { icon: MessageSquare, color: "#EF4444" },
  { icon: Clock, color: "#10B981" },
];

export const EASE = [0.22, 1, 0.36, 1] as const;

export const VIEWPORT = { once: true, amount: 0.25 } as const;
