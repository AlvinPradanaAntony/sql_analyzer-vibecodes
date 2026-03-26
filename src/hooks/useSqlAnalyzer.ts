import { useState, useMemo } from "react";
import type { AnalysisResult } from "../types/sql";
import { analyzeSql } from "../lib/sql-parser";
import { DEFAULT_SQL_PLACEHOLDER } from "@/lib/upload-phase";

export function useSqlAnalyzer() {
  const [sqlText, setSqlText] = useState("");
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const parsed = useMemo(() => {
    const normalText = (sqlText || "").replace(/\r/g, "").trim();
    const normalPlaceholder = DEFAULT_SQL_PLACEHOLDER.replace(/\r/g, "").trim();

    if (!normalText || normalText === normalPlaceholder) {
      return { analysis: null, error: null };
    }

    try {
      const result = analyzeSql(sqlText, fileName);
      
      if (!result) {
        // Jika teks isinya murni hanya komentar SQL (-- dsb) atau benar-benar kosong
        // parser akan me-return null. Jangan error-kan, biarkan di EmptyState.
        return { analysis: null, error: null };
      }

      if (result.tables.length === 0) {
        // Ada teks selain komentar (seperti teks ngawur), tapi gagal menemukan struktur CREATE TABLE
        return {
          analysis: null,
          error: "SQL tidak dikenali atau tidak memiliki tabel. Pastikan terdapat statemen CREATE TABLE.",
        };
      }

      return { analysis: result, error: null };
    } catch (e: any) {
      return { analysis: null as AnalysisResult | null, error: `Gagal menganalisis SQL: ${e.message}` };
    }
  }, [sqlText, fileName]);

  const filteredTables = useMemo(() => {
    if (!parsed.analysis) return [];
    if (!search.trim()) return parsed.analysis.tables;
    const lowerSearch = search.toLowerCase();
    return parsed.analysis.tables.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerSearch) ||
        t.columns.some((c) => c.toLowerCase().includes(lowerSearch)),
    );
  }, [parsed.analysis, search]);

  const handleUploadComplete = (text: string, name: string) => {
    setSqlText(text);
    setFileName(name);
    setExpanded({});
    setSearch("");
  };

  const toggleExpand = (tableName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const allExpanded = filteredTables.length > 0 && filteredTables.every((t) => expanded[t.name]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredTables.forEach((table) => {
      next[table.name] = true;
    });
    setExpanded((prev) => ({ ...prev, ...next }));
  };

  const handleCollapseAll = () => {
    const next = { ...expanded };
    filteredTables.forEach((table) => {
      next[table.name] = false;
    });
    setExpanded(next);
  };

  const reset = () => {
    setSqlText(DEFAULT_SQL_PLACEHOLDER);
    setFileName("");
    setSearch("");
    setExpanded({});
  };

  return {
    state: {
      sqlText,
      fileName,
      search,
      expanded,
      allExpanded,
      parsedAnalysis: parsed.analysis,
      parsedError: parsed.error,
      filteredTables,
    },
    actions: {
      setSqlText,
      setFileName,
      setSearch,
      handleUploadComplete,
      toggleExpand,
      handleExpandAll,
      handleCollapseAll,
      reset,
    },
  };
}
