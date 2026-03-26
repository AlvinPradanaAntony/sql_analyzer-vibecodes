import React from "react";
import { motion } from "framer-motion";

type Accent = string;
type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export function HeroInfoCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: IconType;
  label: string;
  value: string;
  sublabel?: string;
  accent: Accent;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`group relative overflow-hidden rounded-[28px] border border-white/50 bg-linear-to-br ${accent} p-4 sm:p-5 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)]`}
    >
      <div 
        className="absolute top-0 right-0 w-[60%] max-w-[175px] h-full pointer-events-none z-0 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to left, black 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 85%)'
        }}
      >
        {/* Icon dinamis besar sebagai background abstrak */}
        <Icon 
          className="absolute top-1/2 right-0 translate-x-[20%] w-full max-w-[175px] h-auto aspect-square text-white opacity-[0.15] transform -translate-y-1/2" 
          strokeWidth={1}
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-white/85 sm:text-sm">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight sm:mt-3 sm:text-3xl">{value}</div>
          {sublabel ? <div className="mt-1 text-xs text-white/80 sm:mt-2 sm:text-sm">{sublabel}</div> : null}
        </div>
        <div className="rounded-[12px] bg-white/25 p-2 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 sm:rounded-2xl sm:p-3">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </motion.div>
  );
}
