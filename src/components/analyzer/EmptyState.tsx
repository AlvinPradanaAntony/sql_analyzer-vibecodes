import type { UploadPhase } from "../../types/sql";
import { getUploadPhaseMeta } from "../../lib/upload-phase";
import { Card, CardContent } from "../ui/card";
import { Database } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyState({
  isUploading = false,
  uploadStatusText = "",
  uploadPhase = "idle",
}: {
  isUploading?: boolean;
  uploadStatusText?: string;
  uploadPhase?: UploadPhase;
}) {
  const UploadIcon = getUploadPhaseMeta(uploadPhase).icon;
  const spin = isUploading && uploadPhase === "uploading";

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="overflow-hidden rounded-[32px] border-white/50 bg-white/80 shadow-[0_30px_80px_rgba(59,130,246,0.16)] backdrop-blur-sm p-0 ring-0">
        <CardContent className="relative flex flex-col items-center justify-center gap-5 py-20 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_30%)]" />
          <div className="relative rounded-[28px] bg-linear-to-br from-sky-500 via-cyan-500 to-violet-500 p-5 text-white shadow-2xl">
            {isUploading ? (
              <motion.div
                animate={{ rotate: spin ? 360 : 0, scale: [1, 1.04, 1] }}
                transition={{ rotate: { repeat: spin ? Infinity : 0, duration: 1, ease: "linear" }, scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" } }}
                className="flex items-center justify-center"
              >
                <UploadIcon className="h-10 w-10" />
              </motion.div>
            ) : (
              <Database className="h-10 w-10" />
            )}
          </div>
          <div className="relative">
            <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {isUploading ? uploadStatusText || "Memproses file SQL..." : "Upload file SQL untuk mulai analisis"}
            </h3>
            <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-slate-600">
              {isUploading
                ? "Mohon tunggu, file sedang dibaca dan dianalisis secara bertahap agar transisi terasa lebih halus."
                : "Aplikasi ini akan membaca struktur CREATE TABLE dan data INSERT INTO, lalu menampilkan seluruh data tabel dengan pagination, sorting, dan panel interaktif per tabel."}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
