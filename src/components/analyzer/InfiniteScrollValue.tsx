import React from "react";
import { motion } from "framer-motion";
import { normalizeWhitespace } from "../../lib/sql-parser";

export function InfiniteScrollValue({ text }: { text: string | number }) {
  const content = normalizeWhitespace(text);
  const shouldScroll = content.length > 18;
  const fadeMask = {
    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
    maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
  } as React.CSSProperties;

  if (!shouldScroll) {
    return (
      <div className="mt-3 overflow-hidden">
        <div className="break-words text-[clamp(1.2rem,1.8vw,2rem)] font-bold leading-[1.15] tracking-tight text-white">
          {content}
        </div>
      </div>
    );
  }

  const duration = Math.max(10, content.length * 0.35);

  return (
    <div className="mt-3 overflow-hidden" style={fadeMask}>
      <motion.div
        className="flex min-w-max items-center gap-10 whitespace-nowrap text-[clamp(1.2rem,1.8vw,2rem)] font-bold leading-[1.15] tracking-tight text-white will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        <span>{content}</span>
        <span aria-hidden="true">{content}</span>
      </motion.div>
    </div>
  );
}
