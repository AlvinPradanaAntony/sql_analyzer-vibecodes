import { motion } from "framer-motion";
import type { ParsedTable } from "../../types/sql";

export function SummaryTable({ tables, onTableClick }: { tables: ParsedTable[]; onTableClick?: (tableName: string) => void }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-[20px] sm:rounded-[28px] border border-white/40 bg-white shadow-[0_20px_60px_rgba(59,130,246,0.15)]">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-linear-to-r from-sky-100 via-cyan-50 to-violet-100 text-slate-700">
          <tr>
            <th className="whitespace-nowrap p-3 text-left font-semibold sm:p-4">No</th>
            <th className="whitespace-nowrap p-3 text-left font-semibold sm:p-4">Nama Tabel</th>
            <th className="whitespace-nowrap p-3 text-left font-semibold sm:p-4">Jumlah Kolom</th>
            <th className="whitespace-nowrap p-3 text-left font-semibold sm:p-4">Jumlah Baris</th>
            <th className="whitespace-nowrap p-3 text-left font-semibold sm:p-4">Ada Sample Data</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table, index) => (
            <motion.tr
              key={table.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
              className="border-t border-slate-200/70 bg-white/75 transition-colors hover:bg-sky-50/70"
            >
              <td className="px-3 py-2 font-medium text-slate-600 sm:px-4 sm:py-3">{table.no}</td>
              <td 
                className="whitespace-nowrap px-3 py-2 font-semibold text-sky-600 sm:px-4 sm:py-3 cursor-pointer hover:text-sky-800 hover:underline transition-colors"
                onClick={() => onTableClick?.(table.name)}
              >
                {table.name}
              </td>
              <td className="px-3 py-2 text-slate-600 sm:px-4 sm:py-3">{table.columnCount}</td>
              <td className="px-3 py-2 text-slate-600 sm:px-4 sm:py-3">{table.rowCount}</td>
              <td className="px-3 py-2 sm:px-4 sm:py-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${table.hasSampleData ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {table.hasSampleData ? "Ya" : "Tidak"}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
