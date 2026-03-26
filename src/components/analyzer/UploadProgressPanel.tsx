import { motion } from "framer-motion";
import type { UploadPhase } from "../../types/sql";
import { getUploadPhaseMeta, PHASE_ORDER } from "../../lib/upload-phase";
interface UploadProgressPanelProps {
  uploadProgress: number;
  uploadStatusText: string;
  uploadPhase: UploadPhase;
  /** The icon for the currently active phase, resolved by the parent */
  PhaseIcon: React.ComponentType<{ className?: string }>;
}

export function UploadProgressPanel({
  uploadProgress,
  uploadStatusText,
  uploadPhase,
  PhaseIcon,
}: UploadProgressPanelProps) {
  const currentIdx = PHASE_ORDER.indexOf(uploadPhase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/80 via-white/90 to-violet-50/80 p-5 shadow-[0_8px_32px_rgba(99,102,241,0.14)] backdrop-blur-sm"
    >
      {/* ── Header: animated icon · status text · percentage badge ── */}
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-indigo-400/30"
        >
          <PhaseIcon className="h-4 w-4" />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{uploadStatusText}</p>
          <p className="text-xs text-slate-400">Harap tunggu, sedang diproses…</p>
        </div>

        <div className="shrink-0 rounded-lg bg-linear-to-br from-sky-500 to-violet-500 px-2.5 py-1 text-xs font-bold tabular-nums text-white shadow-sm">
          {uploadProgress}%
        </div>
      </div>

      {/* ── Gradient progress bar with shimmer overlay ── */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-sky-400 via-indigo-500 to-violet-500"
          initial={{ width: "0%" }}
          animate={{ width: `${uploadProgress}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
        {/* shimmer — only visible once progress started */}
        {uploadProgress > 0 && (
          <motion.div
            className="absolute inset-y-0 w-24 rounded-full bg-linear-to-r from-transparent via-white/50 to-transparent"
            animate={{ left: ["-10%", "110%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 }}
          />
        )}
      </div>

      {/* ── Phase step tracker ── */}
      <div className="mt-4 flex items-center justify-between gap-1">
        {PHASE_ORDER.map((phase, idx) => {
          const { icon: StepIcon } = getUploadPhaseMeta(phase);
          const stepIdx = idx;
          const isDone = stepIdx < currentIdx;
          const isActive = phase === uploadPhase;

          return (
            <div key={phase} className="flex flex-1 flex-col items-center gap-1">
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300",
                  isActive
                    ? "bg-linear-to-br from-sky-500 to-violet-500 text-white shadow-md shadow-indigo-300/40 ring-2 ring-indigo-300"
                    : isDone
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-300",
                ].join(" ")}
              >
                <StepIcon className="h-3 w-3" />
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
