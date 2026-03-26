
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Database,
  FileSearch,
  ScanSearch,
  Settings2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wand2,
  Layers3,
  TableProperties,
  Rows3,
  FileUp,
  Palette,
  Zap,
} from "lucide-react";

const DEFAULT_SQL_PLACEHOLDER = `-- Tempel isi dump SQL di sini
-- Contoh:
-- CREATE TABLE users (
--   id INT PRIMARY KEY,
--   name VARCHAR(100)
-- );

-- INSERT INTO users (id, name) VALUES (1, 'Alice');`;

type ParsedRow = Record<string, unknown>;

type ParsedTable = {
  no: number;
  name: string;
  columns: string[];
  columnCount: number;
  hasSampleData: boolean;
  rowCount: number;
  sampleRows: ParsedRow[];
};

type AnalysisResult = {
  databaseName: string;
  projectType: string;
  totalTables: number;
  tablesWithSampleData: number;
  totalRows: number;
  tables: ParsedTable[];
};

type UploadPhase =
  | "idle"
  | "uploading"
  | "preparing"
  | "reading"
  | "scanning"
  | "analyzing"
  | "building"
  | "finishing";

function normalizeWhitespace(value: unknown): string {
  if (value == null) return "NULL";
  return String(value).replace(/\s+/g, " ").trim();
}

function truncateValue(value: unknown, max = 120): string {
  const text = normalizeWhitespace(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function maskSensitiveValue(columnName: string, value: unknown): unknown {
  const key = String(columnName || "").toLowerCase();
  if (key.includes("password") || key.includes("passwd") || key.includes("pwd")) {
    return value == null || value === "" ? "" : "••••••";
  }
  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File tidak bisa dibaca."));
    reader.readAsText(file);
  });
}

function getUploadPhaseMeta(phase: UploadPhase): {
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

function inferProjectType(tableNames: string[]): string {
  const lower = tableNames.map((name) => name.toLowerCase());
  const has = (term: string) => lower.some((t) => t.includes(term));

  if (lower.some((t) => t.startsWith("wp_") || t === "wp_posts" || t === "wp_users")) {
    return "WordPress / CMS";
  }
  if (["bus", "rute", "terminal", "tiket", "pemesanan", "pembayaran", "penumpang"].some(has)) {
    return "Sistem reservasi / pemesanan tiket bus atau travel";
  }
  if (["product", "products", "order", "orders", "cart", "checkout", "payment", "payments"].some(has)) {
    return "E-commerce / toko online";
  }
  if (["pegawai", "karyawan", "employee", "department", "payroll"].some(has)) {
    return "Sistem HR / kepegawaian";
  }
  if (["mahasiswa", "siswa", "kelas", "nilai", "jadwal", "course", "student"].some(has)) {
    return "Sistem akademik / pendidikan";
  }
  if (["pasien", "dokter", "rekam_medis", "obat", "appointment"].some(has)) {
    return "Sistem klinik / kesehatan";
  }
  if (["user", "users", "role", "roles", "permission", "permissions", "auth"].some(has)) {
    return "Aplikasi umum dengan manajemen pengguna";
  }
  return "Aplikasi database umum / custom";
}

function inferDatabaseName(sqlText: string, fileName: string): string {
  const useMatch = sqlText.match(/USE\s+`?([^`\s;]+)`?\s*;/i);
  if (useMatch) return useMatch[1];

  const createDbMatch = sqlText.match(/CREATE\s+DATABASE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?([^`\s;]+)`?/i);
  if (createDbMatch) return createDbMatch[1];

  if (fileName) return fileName.replace(/\.sql$/i, "");
  return "Tidak terdeteksi";
}

function parseSqlLiteral(token: string | null | undefined): unknown {
  if (token == null) return null;
  const trimmed = token.trim();
  if (/^null$/i.test(trimmed)) return null;

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const inner = trimmed.slice(1, -1);
    return inner
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\r/g, "\r")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");
  }

  return trimmed;
}

function splitRowValues(rowText: string): unknown[] {
  const values: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < rowText.length; i += 1) {
    const ch = rowText[i];
    const prev = rowText[i - 1];

    if ((ch === "'" || ch === '"') && prev !== "\\") {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuote = false;
      }
      current += ch;
      continue;
    }

    if (ch === "," && !inQuote) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim().length > 0) values.push(current.trim());
  return values.map(parseSqlLiteral);
}

function extractCreateTables(sqlText: string) {
  const tables: Array<{ tableName: string; columns: string[]; sampleRows: ParsedRow[] }> = [];
  const regex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?([^`\s(]+)`?\s*\(([^]*?)\)\s*(?:ENGINE|TYPE|;)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sqlText)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const columns: string[] = [];
    const lines = body.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line) continue;
      if (/^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FULLTEXT|SPATIAL)/i.test(line)) continue;
      const columnMatch = line.match(/^`([^`]+)`\s+/);
      if (columnMatch) columns.push(columnMatch[1]);
    }

    tables.push({ tableName, columns, sampleRows: [] });
  }

  return tables;
}

function splitRows(valuesBlock: string): string[] {
  const rows: string[] = [];
  let current = "";
  let depth = 0;
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const ch = valuesBlock[i];
    const prev = valuesBlock[i - 1];

    if ((ch === "'" || ch === '"') && prev !== "\\") {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuote = false;
      }
      current += ch;
      continue;
    }

    if (!inQuote && ch === "(") {
      depth += 1;
      if (depth === 1) {
        current = "";
        continue;
      }
    }

    if (!inQuote && ch === ")") {
      depth -= 1;
      if (depth === 0) {
        rows.push(current);
        current = "";
        continue;
      }
    }

    if (depth >= 1) current += ch;
  }

  return rows;
}

function extractInsertRows(
  sqlText: string,
  tableMap: Map<string, { tableName: string; columns: string[]; sampleRows: ParsedRow[] }>,
) {
  const insertRegex = /INSERT\s+INTO\s+`?([^`\s(]+)`?\s*(?:\(([^;]*?)\))?\s*VALUES\s*([^;]+);/gi;
  let match: RegExpExecArray | null;

  while ((match = insertRegex.exec(sqlText)) !== null) {
    const tableName = match[1];
    const explicitColumns = match[2]
      ? Array.from(match[2].matchAll(/`([^`]+)`/g)).map((m) => m[1])
      : null;
    const valuesBlock = match[3];
    const table = tableMap.get(tableName);
    if (!table) continue;

    const rowStrings = splitRows(valuesBlock);
    for (const rowText of rowStrings) {
      const parsedValues = splitRowValues(rowText);
      const rowObject: ParsedRow = {};
      const columns = explicitColumns && explicitColumns.length ? explicitColumns : table.columns;

      columns.forEach((col, index) => {
        rowObject[col] = parsedValues[index] ?? null;
      });

      table.sampleRows.push(rowObject);
    }
  }
}

function analyzeSql(sqlText: string, fileName = ""): AnalysisResult | null {
  const cleaned = sqlText.replace(/\/\*![^]*?\*\//g, "");
  const meaningfulSql = cleaned
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trimStart();
      return trimmed && !trimmed.startsWith("--");
    })
    .join("\n");

  if (!meaningfulSql.trim()) {
    return null;
  }

  const tables = extractCreateTables(meaningfulSql);
  const tableMap = new Map(tables.map((table) => [table.tableName, table]));
  extractInsertRows(meaningfulSql, tableMap);

  const resultTables: ParsedTable[] = tables.map((table, index) => ({
    no: index + 1,
    name: table.tableName,
    columns: table.columns,
    columnCount: table.columns.length,
    hasSampleData: table.sampleRows.length > 0,
    rowCount: table.sampleRows.length,
    sampleRows: table.sampleRows,
  }));

  const tableNames = resultTables.map((t) => t.name);
  return {
    databaseName: inferDatabaseName(meaningfulSql, fileName),
    projectType: inferProjectType(tableNames),
    totalTables: resultTables.length,
    tablesWithSampleData: resultTables.filter((t) => t.hasSampleData).length,
    totalRows: resultTables.reduce((sum, table) => sum + table.rowCount, 0),
    tables: resultTables,
  };
}

function SummaryTable({ tables }: { tables: ParsedTable[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/40 bg-white/80 shadow-[0_20px_60px_rgba(59,130,246,0.15)] backdrop-blur-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-linear-to-r from-sky-100 via-cyan-50 to-violet-100 text-slate-700">
          <tr>
            <th className="px-4 py-4 text-left font-semibold">No</th>
            <th className="px-4 py-4 text-left font-semibold">Nama Tabel</th>
            <th className="px-4 py-4 text-left font-semibold">Jumlah Kolom</th>
            <th className="px-4 py-4 text-left font-semibold">Jumlah Baris</th>
            <th className="px-4 py-4 text-left font-semibold">Ada Sample Data</th>
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
              <td className="px-4 py-3 font-medium text-slate-600">{table.no}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{table.name}</td>
              <td className="px-4 py-3 text-slate-600">{table.columnCount}</td>
              <td className="px-4 py-3 text-slate-600">{table.rowCount}</td>
              <td className="px-4 py-3">
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

function InfiniteScrollValue({ text }: { text: string | number }) {
  const content = normalizeWhitespace(text);
  const shouldScroll = content.length > 18;
  const fadeMask = {
    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
    maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
  } as React.CSSProperties;

  if (!shouldScroll) {
    return (
      <div className="mt-3 overflow-hidden">
        <div className="wrap-break-word text-[clamp(1.2rem,1.8vw,2rem)] font-bold leading-[1.15] tracking-tight text-white">
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

type Accent = string;

type IconType = React.ComponentType<{ className?: string }>;

function StatCard({
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
      className={`group relative flex h-[168px] w-full overflow-hidden rounded-[28px] border border-white/50 bg-linear-to-br ${accent} p-5 text-left text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%)]" />
      <div className="relative flex h-full w-full flex-col gap-2.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 overflow-hidden pr-2">
            <div className="truncate text-sm font-medium text-white/85">{label}</div>
            <InfiniteScrollValue text={value} />
          </div>
          <div className="shrink-0 rounded-2xl bg-white/25 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {sublabel ? <div className="mt-auto max-w-[90%] text-sm leading-5 text-white/80">{sublabel}</div> : null}
      </div>
    </motion.div>
  );
}

function HeroInfoCard({
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
      className={`group relative overflow-hidden rounded-[28px] border border-white/50 bg-linear-to-br ${accent} p-5 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white/85">{label}</div>
          <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
          {sublabel ? <div className="mt-2 text-sm text-white/80">{sublabel}</div> : null}
        </div>
        <div className="rounded-2xl bg-white/25 p-3 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

function compareValues(a: unknown, b: unknown): number {
  const aNormalized = normalizeWhitespace(a);
  const bNormalized = normalizeWhitespace(b);

  const aNumber = Number(aNormalized);
  const bNumber = Number(bNormalized);
  const aIsNumber = aNormalized !== "" && !Number.isNaN(aNumber);
  const bIsNumber = bNormalized !== "" && !Number.isNaN(bNumber);

  if (aIsNumber && bIsNumber) {
    return aNumber - bNumber;
  }

  return aNormalized.localeCompare(bNormalized, undefined, { numeric: true, sensitivity: "base" });
}

function PaginationControls({
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
    <div className="flex flex-col gap-3 border-t border-white/50 bg-linear-to-r from-white/70 to-sky-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
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

function TablePreview({
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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

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

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, visibleRows, rowsPerPage, sortConfig, table.rowCount]);

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
      return <ArrowUpDown className="h-4 w-4 text-slate-400 transition group-hover:text-sky-500" />;
    }

    return sortConfig.direction === "asc" ? <ArrowUp className="h-4 w-4 text-sky-600" /> : <ArrowDown className="h-4 w-4 text-violet-600" />;
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <Card className="overflow-hidden rounded-[30px] border-white/40 bg-white/85 shadow-[0_14px_38px_rgba(14,116,144,0.10)] backdrop-blur-[2px] transition-shadow duration-200 hover:shadow-[0_18px_44px_rgba(99,102,241,0.14)]">
        <button
          type="button"
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-4 bg-linear-to-r from-white/80 via-cyan-50/55 to-violet-50/55 px-6 py-5 text-left transition-colors duration-200 hover:from-sky-50/80 hover:via-cyan-50/60 hover:to-violet-50/70"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-linear-to-br from-sky-500 to-violet-500 p-2 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TableProperties className="h-4 w-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900">{table.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-700">{table.columnCount} kolom</span>
            <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-700">{table.rowCount} baris data</span>
            <div className="rounded-2xl bg-white/90 p-3 text-slate-700 shadow-sm transition-transform duration-200 group-hover:scale-[1.03] group-hover:bg-white">
              {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </div>
          </div>
        </button>

        <div style={{ height: expanded ? contentHeight : 0 }} className="overflow-hidden transition-[height,opacity] duration-300 ease-out">
          <div ref={contentRef} className={`${expanded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}>
            <div className="border-t border-white/40 bg-linear-to-b from-white/78 to-sky-50/30">
              <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  Menampilkan <span className="font-semibold text-slate-900">{table.rowCount === 0 ? 0 : startIndex + 1}</span>
                  {table.rowCount > 0 ? `–${Math.min(endIndex, table.rowCount)}` : ""} dari <span className="font-semibold text-slate-900">{table.rowCount}</span> baris
                </div>
                <div className="flex items-center gap-2 text-sm">
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
                <table className="min-w-full text-sm">
                  <thead className="bg-linear-to-r from-sky-100/90 via-cyan-50/85 to-violet-100/90 text-slate-700">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">No</th>
                      {table.columns.map((col) => (
                        <th key={col} className="whitespace-nowrap px-4 py-3 text-left font-semibold">
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
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-700">{startIndex + rowIndex + 1}</td>
                          {table.columns.map((col) => (
                            <td key={col} className="max-w-[320px] wrap-break-words px-4 py-3 text-sm text-slate-700">
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
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EmptyState({
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
      <Card className="overflow-hidden rounded-[32px] border-white/50 bg-white/80 shadow-[0_30px_80px_rgba(59,130,246,0.16)] backdrop-blur-sm">
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
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {isUploading ? uploadStatusText || "Memproses file SQL..." : "Upload file SQL untuk mulai analisis"}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
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

export default function SqlDumpAnalyzerApp() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sqlText, setSqlText] = useState("");
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");

  const parsed = useMemo(() => {
    if (!sqlText.trim()) {
      return { analysis: null as AnalysisResult | null, error: "" };
    }

    try {
      return {
        analysis: analyzeSql(sqlText, fileName),
        error: "",
      };
    } catch (err) {
      return {
        analysis: null,
        error: err instanceof Error ? err.message : "Gagal memproses file SQL.",
      };
    }
  }, [sqlText, fileName]);

  const analysis = parsed.analysis;
  const error = fileError || parsed.error;

  const filteredTables = useMemo(() => {
    if (!analysis) return [] as ParsedTable[];
    const q = search.trim().toLowerCase();
    if (!q) return analysis.tables;

    return analysis.tables.filter(
      (table) => table.name.toLowerCase().includes(q) || table.columns.some((col) => col.toLowerCase().includes(q)),
    );
  }, [analysis, search]);

  const allExpanded = filteredTables.length > 0 && filteredTables.every((t) => expanded[t.name]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setFileError("");
    setExpanded({});
    setSearch("");

    const phaseSequence: Array<{ phase: UploadPhase; progress: number; wait: number }> = [
      { phase: "uploading", progress: 12, wait: 420 },
      { phase: "preparing", progress: 24, wait: 420 },
      { phase: "reading", progress: 42, wait: 520 },
      { phase: "scanning", progress: 62, wait: 520 },
      { phase: "analyzing", progress: 80, wait: 560 },
      { phase: "building", progress: 92, wait: 420 },
    ];

    try {
      const fileTextPromise = readFileAsText(file);

      for (const step of phaseSequence) {
        const meta = getUploadPhaseMeta(step.phase);
        setUploadPhase(step.phase);
        setUploadStatusText(meta.text);
        setUploadProgress(step.progress);
        await sleep(step.wait);
      }

      const fileText = await fileTextPromise;
      const finishingMeta = getUploadPhaseMeta("finishing");
      setUploadPhase("finishing");
      setUploadStatusText(finishingMeta.text);
      setUploadProgress(100);
      await sleep(520);

      setSqlText(fileText);
      setFileError("");

      await sleep(220);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText("");
      setUploadPhase("idle");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText("");
      setUploadPhase("idle");
      setFileError(err instanceof Error ? err.message : "File tidak bisa dibaca.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleExpandAll() {
    const next: Record<string, boolean> = {};
    filteredTables.forEach((table) => {
      next[table.name] = true;
    });
    setExpanded((prev) => ({ ...prev, ...next }));
  }

  function handleCollapseAll() {
    const next = { ...expanded };
    filteredTables.forEach((table) => {
      next[table.name] = false;
    });
    setExpanded(next);
  }

  const buttonIcon = getUploadPhaseMeta(isUploading ? uploadPhase : "idle").icon;
  const fileInfoIcon = isUploading ? getUploadPhaseMeta(uploadPhase).icon : FileText;
  const shouldSpin = isUploading && uploadPhase === "uploading";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
          <div className="relative overflow-hidden rounded-[36px] border border-white/50 bg-white/75 p-6 shadow-[0_30px_90px_rgba(99,102,241,0.14)] backdrop-blur-sm md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_28%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                  <Palette className="h-4 w-4 text-violet-500" />
                  SQL Dump Analyzer Experience
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">Analisis file SQL dengan UI yang lebih hidup, cepat, dan interaktif.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Upload dump SQL atau tempel isi file langsung. Sistem akan memetakan tabel, mendeteksi tipe database, menampilkan row lengkap, pagination, sorting, dan tampilan yang lebih colorful dengan animasi halus.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge className="rounded-full bg-sky-500 px-4 py-2 text-white shadow-md hover:bg-sky-600">Interaktif</Badge>
                  <Badge className="rounded-full bg-violet-500 px-4 py-2 text-white shadow-md hover:bg-violet-600">Animated</Badge>
                  <Badge className="rounded-full bg-emerald-500 px-4 py-2 text-white shadow-md hover:bg-emerald-600">Data-rich</Badge>
                </div>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.35 }} className="grid auto-rows-[220px] gap-4 sm:grid-cols-2">
                <HeroInfoCard icon={Layers3} label="Mode tampilan" value="Colorful" sublabel="Gradien, blur, dan depth" accent="from-sky-500 to-cyan-500" />
                <HeroInfoCard icon={Zap} label="Interaksi" value="Micro UI" sublabel="Hover, expand, sorting, pagination" accent="from-violet-500 to-fuchsia-500" />
                <HeroInfoCard icon={FileUp} label="Input" value="SQL File" sublabel="Upload atau paste langsung" accent="from-emerald-500 to-teal-500" />
                <HeroInfoCard icon={Wand2} label="Analisa" value="Auto Detect" sublabel="Tipe proyek & struktur tabel" accent="from-amber-500 to-orange-500" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.32 }}>
            <Card className="rounded-[32px] border-white/50 bg-white/80 shadow-[0_25px_80px_rgba(59,130,246,0.14)] backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <motion.div whileHover={{ rotate: 6, scale: 1.06 }} className="rounded-[24px] bg-linear-to-br from-sky-500 to-violet-500 p-4 text-white shadow-xl">
                    <Database className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-2xl text-slate-900">SQL Dump Analyzer</CardTitle>
                    <CardDescription className="mt-2 leading-7 text-slate-600">
                      Upload file <code className="rounded bg-slate-900 px-1.5 py-0.5 text-white">.sql</code> lalu aplikasi akan menganalisis jumlah tabel, nama tabel, jumlah kolom, jumlah baris, tipe proyek database, dan menampilkan seluruh row dengan pagination per tabel.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2 rounded-2xl bg-linear-to-r from-sky-500 to-violet-500 text-white shadow-lg transition hover:-translate-y-0.5 hover:from-sky-600 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-90">
                    <motion.span
                      animate={isUploading ? { rotate: shouldSpin ? 360 : 0, scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
                      transition={isUploading ? { rotate: { repeat: shouldSpin ? Infinity : 0, duration: 1, ease: "linear" }, scale: { repeat: Infinity, duration: 0.9, ease: "easeInOut" } } : { duration: 0.2 }}
                      className="inline-flex"
                    >
                      {React.createElement(buttonIcon, { className: "h-4 w-4" })}
                    </motion.span>
                    {isUploading ? uploadStatusText || "Mengupload file..." : "Upload File SQL"}
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".sql,text/sql" className="hidden" onChange={handleFileChange} />
                  <Button
                    variant="outline"
                    className="gap-2 rounded-2xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                    onClick={() => {
                      setSqlText(DEFAULT_SQL_PLACEHOLDER);
                      setFileName("");
                      setSearch("");
                      setExpanded({});
                      setFileError("");
                      setIsUploading(false);
                      setUploadProgress(0);
                      setUploadStatusText("");
                      setUploadPhase("idle");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Reset
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700">Atau tempel isi SQL langsung</div>
                  <div className="overflow-hidden rounded-[24px] border-2 border-sky-200/80 bg-white/80 shadow-inner ring-1 ring-white/60">
                    <Editor
                      height="220px"
                      defaultLanguage="sql"
                      defaultValue={DEFAULT_SQL_PLACEHOLDER}
                      value={sqlText}
                      onChange={(value) => {
                        setSqlText(value || "");
                        if (!fileName) setFileName("pasted_sql.sql");
                        setFileError("");
                      }}
                      theme="vs-light"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 },
                        lineNumbers: "on",
                        roundedSelection: true,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: false,
                      }}
                    />
                  </div>
                </div>

                {fileName ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div
                        animate={isUploading ? { scale: [1, 1.08, 1], rotate: shouldSpin ? 360 : 0 } : { scale: 1, rotate: 0 }}
                        transition={isUploading ? { scale: { repeat: Infinity, duration: 0.9, ease: "easeInOut" }, rotate: { repeat: shouldSpin ? Infinity : 0, duration: 1, ease: "linear" } } : { duration: 0.2 }}
                      >
                        {React.createElement(fileInfoIcon, { className: "h-4 w-4 text-sky-500" })}
                      </motion.div>
                      File aktif: <span className="font-semibold text-slate-900">{fileName}</span>
                    </div>
                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{uploadStatusText || "Membaca file SQL..."}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/80">
                          <motion.div className="h-full rounded-full bg-linear-to-r from-sky-500 to-violet-500" animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.2, ease: "easeOut" }} />
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}

                {error ? <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</motion.div> : null}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.32 }}>
            <Card className="rounded-[32px] border-white/50 bg-white/80 shadow-[0_25px_80px_rgba(139,92,246,0.14)] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  Format Analisis
                </CardTitle>
                <CardDescription className="text-slate-600">Versi ini menampilkan data tabel penuh dengan pagination dan interaksi visual yang lebih modern.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="rounded-[24px] border border-sky-100 bg-linear-to-br from-sky-50 to-cyan-50 p-4 shadow-sm">
                  <div className="font-semibold text-slate-900">Ringkasan Tabel</div>
                  <div className="mt-2 leading-6">Jumlah tabel, analisa jenis database/proyek, jumlah kolom, jumlah baris, dan status sample data.</div>
                </div>
                <div className="rounded-[24px] border border-violet-100 bg-linear-to-br from-violet-50 to-fuchsia-50 p-4 shadow-sm">
                  <div className="font-semibold text-slate-900">View Tabel</div>
                  <div className="mt-2 leading-6">Setiap tabel memiliki panel collapse, pilihan baris per halaman, sorting per kolom, serta tombol navigasi halaman.</div>
                </div>
                <div className="rounded-[24px] border border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
                  <div className="font-semibold text-slate-900">Micro Interaction</div>
                  <div className="mt-2 leading-6">Hover feedback, animated cards, soft transitions, progress indicator, dan detail state yang lebih jelas.</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {!analysis ? (
          <EmptyState isUploading={isUploading} uploadStatusText={uploadStatusText} uploadPhase={uploadPhase} />
        ) : (
          <div className="space-y-8">
            <section className="space-y-5">
              <div className="grid auto-rows-[168px] gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Database} label="Nama Database" value={analysis.databaseName} sublabel="Terdeteksi otomatis" accent="from-sky-500 to-cyan-500" />
                <StatCard icon={Wand2} label="Jenis Proyek" value={analysis.projectType} sublabel="Hasil inferensi dari nama tabel" accent="from-violet-500 to-fuchsia-500" />
                <StatCard icon={TableProperties} label="Jumlah Tabel" value={analysis.totalTables} sublabel={`${analysis.tablesWithSampleData} tabel berisi data`} accent="from-emerald-500 to-teal-500" />
                <StatCard icon={Rows3} label="Total Baris" value={analysis.totalRows} sublabel="Seluruh row yang berhasil diparse" accent="from-amber-500 to-orange-500" />
              </div>

              <Card className="rounded-[32px] border-white/50 bg-white/80 shadow-[0_25px_80px_rgba(59,130,246,0.14)] backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">Ringkasan Tabel</CardTitle>
                      <CardDescription className="mt-2 max-w-3xl leading-7 text-slate-600">
                        Database bernama <strong>{analysis.databaseName}</strong>. Berdasarkan nama tabel yang ditemukan, database ini paling mungkin digunakan untuk <strong>{analysis.projectType.toLowerCase()}</strong>.
                      </CardDescription>
                    </div>
                    <div className="min-w-[220px] rounded-[24px] bg-slate-50/80 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                        <span>Kepadatan tabel berisi data</span>
                        <span className="font-semibold text-slate-900">{Math.round((analysis.tablesWithSampleData / Math.max(analysis.totalTables, 1)) * 100)}%</span>
                      </div>
                      <Progress value={(analysis.tablesWithSampleData / Math.max(analysis.totalTables, 1)) * 100} className="h-2.5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SummaryTable tables={analysis.tables} />
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-4 rounded-[32px] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">View Tabel</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Cari nama tabel atau kolom, lalu buka panel tabel yang ingin dilihat. Semua row yang berhasil diparse tersedia lewat pagination.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tabel atau kolom..." className="w-full rounded-2xl border-white/60 bg-white/80 pl-9 shadow-sm transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:w-[280px]" />
                  </div>
                  <Button variant="outline" className="gap-2 rounded-2xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white" onClick={allExpanded ? handleCollapseAll : handleExpandAll}>
                    {allExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {allExpanded ? "Tutup Semua" : "Buka Semua"}
                  </Button>
                </div>
              </div>

              <Card className="rounded-[32px] border border-white/50 bg-white/80 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur-sm">
                <CardContent className="p-4 md:p-5">
                  <div className="space-y-4">
                    {filteredTables.length > 0 ? (
                      filteredTables.map((table) => (
                        <TablePreview
                          key={table.name}
                          table={table}
                          expanded={!!expanded[table.name]}
                          onToggle={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [table.name]: !prev[table.name],
                            }))
                          }
                        />
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                        Tidak ada tabel yang cocok dengan pencarian.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
