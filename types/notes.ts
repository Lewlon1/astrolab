export const NOTE_AREAS = [
  "clients",
  "content",
  "todo",
  "money",
  "business",
  "personal",
  "unsorted",
] as const;

export type NoteArea = (typeof NOTE_AREAS)[number];

export const AREA_LABELS: Record<NoteArea, string> = {
  clients: "Clients",
  content: "Content ideas",
  todo: "To-dos",
  money: "Money",
  business: "Business",
  personal: "Personal",
  unsorted: "Unsorted",
};

export type CaptureStatus = "processing" | "done" | "failed";
export type NoteStatus = "inbox" | "filed" | "archived";

export interface NoteCapture {
  id: string;
  photo_paths: string[];
  status: CaptureStatus;
  error: string | null;
  raw_transcript: string | null;
  model: string | null;
  created_at: string;
  started_at: string;
  processed_at: string | null;
}

export interface Note {
  id: string;
  capture_id: string | null;
  area: NoteArea;
  ai_area: NoteArea | null;
  title: string;
  body: string;
  client_name: string | null;
  written_on: string | null;
  status: NoteStatus;
  created_at: string;
  updated_at: string;
}

export interface NoteTask {
  id: string;
  note_id: string;
  text: string;
  due_on: string | null;
  done_at: string | null;
  created_at: string;
}
