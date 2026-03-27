import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedTable } from "../../types/sql";
import { PaginationControls } from "./PaginationControls";
import { Card } from "../ui/card";
import {
  TableProperties,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { compareValues, truncateValue, maskSensitiveValue } from "../../lib/sql-parser";

export function TablePreview({
  table,
  expanded,
  onToggle,
}: {
  table: ParsedTable;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return table.sampleRows;

    const rows = [...table.sampleRows];
    rows.sort((left, right) => {
      const result = compareValues(left[sortConfig.key as string], right[sortConfig.key as string]);
      return sortConfig.direction === "asc" ? result : -result;
    });
    return rows;
  }, [table.sampleRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(table.rowCount / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visibleRows = sortedRows.slice(startIndex, endIndex);

  function handlePageChange(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  function handleRowsPerPageChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextValue = Number(event.target.value);
    setRowsPerPage(nextValue);
    setPage(1);
  }

  function handleSort(column: string) {
    setPage(1);
    setSortConfig((prev) => {
      if (prev.key === column) {
        return {
          key: column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: column,
        direction: "asc",
      };
    });
  }

  function renderSortIcon(column: string) {
    if (sortConfig.key !== column) {
      return (
        <ArrowUpDown className="h-4 w-4 text-slate-400 transition group-hover:text-sky-500" />
      );
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 text-sky-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-violet-600" />
    );
  }

  return (
    <motion.div layout="position" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Card className="overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/40 bg-white shadow-[0_14px_38px_rgba(14,116,144,0.10)] transition-shadow duration-200 hover:shadow-[0_18px_44px_rgba(99,102,241,0.14)] ring-0 p-0 gap-0">
        <button
          type="button"
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-3 sm:gap-4 bg-linear-to-r from-white/80 via-cyan-50/55 to-violet-50/55 px-4 sm:px-6 py-4 sm:py-5 text-left transition-colors duration-200 hover:from-sky-50/80 hover:via-cyan-50/60 hover:to-violet-50/70"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 rounded-[12px] sm:rounded-2xl bg-linear-to-br from-sky-500 to-violet-500 p-2 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TableProperties className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="text-base sm:text-lg font-semibold text-slate-900 truncate">{table.name}</div>
          </div>
          <div className="flex items-center gap-3">
              <span className="rounded-full bg-sky-100 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-sky-700">{table.columnCount} kolom</span>
              <span className="rounded-full bg-violet-100 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-violet-700">{table.rowCount} baris</span>
            <div className="rounded-xl sm:rounded-2xl bg-white/90 p-2 sm:p-3 text-slate-700 shadow-sm transition-transform duration-200 group-hover:scale-[1.03] group-hover:bg-white">
              {expanded ? <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/40 bg-linear-to-b from-white/78 to-sky-50/30">
                <div className="flex flex-col gap-1 px-4 sm:px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs sm:text-sm text-slate-600">
                  Menampilkan <span className="font-semibold text-slate-900">{table.rowCount === 0 ? 0 : startIndex + 1}</span>
                  {table.rowCount > 0 ? `–${Math.min(endIndex, table.rowCount)}` : ""} dari <span className="font-semibold text-slate-900">{table.rowCount}</span> baris
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-2 text-xs sm:text-sm">
                  <label htmlFor={`rows-${table.name}`} className="font-medium text-slate-600">
                    Baris per halaman
                  </label>
                  <select
                    id={`rows-${table.name}`}
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  >
                    {[5, 10, 25, 50, 100].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border-y border-white/40">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-linear-to-r from-sky-100/90 via-cyan-50/85 to-violet-100/90 text-slate-700">
                    <tr>
                      <th className="whitespace-nowrap p-3 sm:p-4 text-left font-semibold">No</th>
                      {table.columns.map((col) => (
                        <th key={col} className="whitespace-nowrap p-3 sm:p-4 text-left font-semibold">
                          <button type="button" onClick={() => handleSort(col)} className="group flex items-center gap-2 rounded-lg transition hover:text-slate-900">
                            <span>{col}</span>
                            {renderSortIcon(col)}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length > 0 ? (
                      visibleRows.map((row, rowIndex) => (
                        <motion.tr key={`${table.name}-${startIndex + rowIndex}`} initial={false} className="border-t border-slate-200/50 align-top transition-colors hover:bg-sky-50/45">
                          <td className="whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-slate-700">{startIndex + rowIndex + 1}</td>
                          {table.columns.map((col) => (
                            <td key={col} className="max-w-[320px] wrap-break-word px-3 py-2 sm:px-4 sm:py-3 text-slate-700">
                              {truncateValue(maskSensitiveValue(col, row[col]))}
                            </td>
                          ))}
                        </motion.tr>
                      ))
                    ) : (
                      <tr className="border-t border-slate-200/50">
                        <td colSpan={Math.max(1, table.columns.length) + 1} className="px-4 py-6 text-center text-muted-foreground">
                          Tidak ada sample data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls page={safePage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
