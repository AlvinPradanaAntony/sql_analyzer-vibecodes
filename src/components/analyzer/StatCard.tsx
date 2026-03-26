import React from "react";
import { motion } from "framer-motion";
import { InfiniteScrollValue } from "./InfiniteScrollValue";

type Accent = string;
type IconType = React.ComponentType<{ className?: string }>;

export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sublabel,
}: {
  icon: IconType;
  label: string;
  value: string | number;
  accent: Accent;
  sublabel?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`group relative flex h-[140px] w-full overflow-hidden rounded-[20px] border border-white/50 bg-linear-to-br ${accent} p-4 text-left text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:h-[168px] sm:rounded-[28px] sm:p-5`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%)]" />
      <div className="relative flex h-full w-full flex-col gap-2.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 overflow-hidden pr-2">
            <div className="truncate text-xs font-medium text-white/85 sm:text-sm">{label}</div>
            <InfiniteScrollValue text={value} />
          </div>
          <div className="shrink-0 rounded-[12px] bg-white/25 p-2 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 sm:rounded-2xl sm:p-3">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
        {sublabel ? <div className="mt-auto max-w-[90%] text-xs leading-snug text-white/80 sm:text-sm sm:leading-5">{sublabel}</div> : null}
      </div>
    </motion.div>
  );
}
