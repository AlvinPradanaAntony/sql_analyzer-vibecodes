import { Button } from "../ui/button";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRightIcon,
  ChevronsRight,
} from "lucide-react";

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-white/50 bg-linear-to-r from-white/70 to-sky-50/70 px-4 py-3 sm:px-6 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        Halaman <span className="font-semibold text-slate-900">{page}</span> dari <span className="font-semibold text-slate-900">{totalPages}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
