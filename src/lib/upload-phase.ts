import {
  Upload,
  Settings2,
  FileText,
  ScanSearch,
  FileSearch,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { UploadPhase } from "../types/sql";

export const DEFAULT_SQL_PLACEHOLDER = `-- Tempel isi dump SQL di sini
-- Contoh:
-- CREATE TABLE users (
--   id INT PRIMARY KEY,
--   name VARCHAR(100)
-- );

-- INSERT INTO users (id, name) VALUES (1, 'Alice');`;

export const PHASE_ORDER: UploadPhase[] = [
  "uploading",
  "preparing",
  "reading",
  "scanning",
  "analyzing",
  "building",
  "finishing",
];

export function getUploadPhaseMeta(phase: UploadPhase): {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  switch (phase) {
    case "uploading":
      return { text: "Mengupload file...", icon: Upload };
    case "preparing":
      return { text: "Menyiapkan file...", icon: Settings2 };
    case "reading":
      return { text: "Membaca file SQL...", icon: FileText };
    case "scanning":
      return { text: "Memindai struktur tabel...", icon: ScanSearch };
    case "analyzing":
      return { text: "Menganalisis isi database...", icon: FileSearch };
    case "building":
      return { text: "Menyusun hasil analisis...", icon: Sparkles };
    case "finishing":
      return { text: "Menyelesaikan proses...", icon: CheckCircle2 };
    default:
      return { text: "Upload File SQL", icon: Upload };
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File tidak bisa dibaca."));
    reader.readAsText(file);
  });
}
