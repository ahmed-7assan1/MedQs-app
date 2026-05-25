"use client";

import React from "react";
import { Sparkle, Student, Quotes, Lightning } from "@phosphor-icons/react";
import type { DrQPersonaId } from "./DrQPersonas";
import type { AIProvider } from "@/hooks/useDrQChat";

export type WorkspaceId = "general" | "medical" | "quiz" | "study";

export interface Workspace {
  id: WorkspaceId;
  name: string;
  icon: React.ReactNode;
  description: string;
  personaId: DrQPersonaId;
  defaultProvider: AIProvider;
  defaultModel: string;
}

export const DRQ_WORKSPACES: Record<WorkspaceId, Workspace> = {
  general: {
    id: "general",
    name: "General",
    icon: React.createElement(Sparkle, { weight: "fill" }),
    description: "General AI assistant for any topic",
    personaId: "explainer",
    defaultProvider: "gemini",
    defaultModel: "gemini-2.0-flash",
  },
  medical: {
    id: "medical",
    name: "Medical",
    icon: React.createElement(Student, { weight: "fill" }),
    description: "Medical exam preparation & clinical reasoning",
    personaId: "quiz",
    defaultProvider: "groq",
    defaultModel: "llama-3.3-70b-versatile",
  },
  quiz: {
    id: "quiz",
    name: "Quiz",
    icon: React.createElement(Quotes, { weight: "fill" }),
    description: "Generate practice questions & mock exams",
    personaId: "quiz",
    defaultProvider: "groq",
    defaultModel: "llama-3.3-70b-versatile",
  },
  study: {
    id: "study",
    name: "Study Plan",
    icon: React.createElement(Lightning, { weight: "fill" }),
    description: "Create personalized study schedules",
    personaId: "planner",
    defaultProvider: "gemini",
    defaultModel: "gemini-2.0-flash",
  },
};

export const WORKSPACE_IDS = Object.keys(DRQ_WORKSPACES) as WorkspaceId[];
