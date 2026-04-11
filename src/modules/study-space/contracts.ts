export type StudyWidgetType =
  | "TODO"
  | "NOTES"
  | "PDF_VIEWER"
  | "POMODORO"
  | "MUSIC"
  | "WHITEBOARD";

export type StudySpaceLayoutItem = {
  widgetId: string;
  type: StudyWidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type StudySpaceServiceContract = {
  saveLayout: (userId: string, layout: StudySpaceLayoutItem[]) => Promise<{ ok: true }>;
  startPomodoro: (userId: string, durationMinutes: number) => Promise<{ sessionId: string }>;
};
