import { useState, useMemo, useEffect } from "react";
import type { AnalysisResult } from "../types/sql";
import { analyzeSql } from "../lib/sql-parser";
import { DEFAULT_SQL_PLACEHOLDER } from "@/lib/upload-phase";

export function useSqlAnalyzer() {
  const [sqlText, setSqlText] = useState("");
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // [DEBOUNCE LOGIC] Mencegah halaman "freeze" saat user mengetik karakter demi karakter
  const [debouncedSqlText, setDebouncedSqlText] = useState(sqlText);
  // Mengunci animasi overlay memuat file HANYA pada saat Upload berlangsung
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSqlText(sqlText);
      setIsProcessingUpload(false); // Cabut status loading upload ketika memori siap dicerna
    }, 500); // Tunggu 500ms pasca user berhenti mengetik sebelum memparsing

    return () => clearTimeout(timer);
  }, [sqlText]);

  const parsed = useMemo(() => {
    const normalText = (debouncedSqlText || "").replace(/\r/g, "").trim();
    const normalPlaceholder = DEFAULT_SQL_PLACEHOLDER.replace(/\r/g, "").trim();

    if (!normalText || normalText === normalPlaceholder) {
      return { analysis: null, error: null };
    }

    try {
      const result = analyzeSql(debouncedSqlText, fileName);
      
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
  }, [debouncedSqlText, fileName]);

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
    // Kunci Anti-Deadlock: Jika file yang baru diupload kontennya SAMA PERSIS dengan 
    // isi editor yang sedang tayang, React menolak memutar Effects Hook [sqlText].
    // Ini malah bisa menjebak isProcessingUpload=true secara abadi!
    if (text === sqlText) {
       setFileName(name); // Cukup mutakhirkan nama filenya (barangkali judulnya beda)
       return; // Akhiri fungsi di sini tanpa menyiksa memori!
    }

    setIsProcessingUpload(true); // Hidupkan kunci proteksi animasi layar saat Upload MEGA File
    setSqlText(text);
    // Mengubah buffer sementara ke kosong agar komponen tahu kita SEDANG memproses file besar
    // Timer 500ms akan menyusul dan melaksanakan sinkronisasi teks secara paripurna
    setDebouncedSqlText(""); 
    setFileName(name);
    setExpanded({});
    setSearch("");
  };

  const toggleExpand = (tableName: string) => {
    setExpanded((prev) => {
      const isCurrentlyExpanded = prev[tableName];
      return {
        [tableName]: !isCurrentlyExpanded,
      };
    });
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
    setDebouncedSqlText(DEFAULT_SQL_PLACEHOLDER); 
    setFileName("");
    setSearch("");
    setExpanded({});
  };

  const isAnalyzing = isProcessingUpload && sqlText !== debouncedSqlText;

  return {
    state: {
      sqlText,
      debouncedSqlText,
      fileName,
      search,
      expanded,
      allExpanded,
      parsedAnalysis: parsed.analysis,
      parsedError: parsed.error,
      filteredTables,
      isAnalyzing,
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
