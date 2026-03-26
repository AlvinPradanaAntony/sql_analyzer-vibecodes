import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ParseErrorStateProps {
  message: string;
}

export function ParseErrorState({ message }: ParseErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[32px] border border-red-100 bg-white p-8 shadow-[0_20px_60px_rgba(239,68,68,0.10)]"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(254,202,202,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(252,165,165,0.25),transparent_50%)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-5 text-center">
        {/* Animated icon */}
        <motion.div
          initial={{ rotate: -8, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-linear-to-br from-red-400 to-rose-500 shadow-lg shadow-red-200"
        >
          <AlertTriangle className="h-8 w-8 text-white" strokeWidth={2} />
        </motion.div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">Parsed gagal</h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
            {message}
          </p>
        </div>

        {/* Hint pill */}
        <div className="flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-5 py-2.5 text-sm text-red-600">
          <RefreshCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Coba paste SQL valid yang berisi setidaknya 1 statement <code className="font-mono font-semibold">CREATE TABLE</code>.</span>
        </div>
      </div>
    </motion.div>
  );
}
