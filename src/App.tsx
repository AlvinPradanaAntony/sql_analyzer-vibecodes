import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Database, Layers3, Rows3, FileText, ScanSearch, Zap, Eye, EyeOff, Search, FileUp, Sparkles } from "lucide-react";

import { DEFAULT_SQL_PLACEHOLDER, getUploadPhaseMeta } from "./lib/upload-phase";
import { useUploadPhase } from "./hooks/useUploadPhase";
import { useSqlAnalyzer } from "./hooks/useSqlAnalyzer";

import { EmptyState } from "./components/analyzer/EmptyState";
import { HeroInfoCard } from "./components/analyzer/HeroInfoCard";
import { StatCard } from "./components/analyzer/StatCard";
import { SummaryTable } from "./components/analyzer/SummaryTable";
import { TablePreview } from "./components/analyzer/TablePreview";
import { UploadProgressPanel } from "./components/analyzer/UploadProgressPanel";
import { ParseErrorState } from "./components/analyzer/ParseErrorState";
import { Progress } from "./components/ui/progress";

export default function SqlDumpAnalyzerApp() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Custom hook for handling upload phase & progress
  const {
    isUploading,
    uploadProgress,
    uploadStatusText,
    uploadPhase,
    fileError: uploadFileError,
    handleFileChange,
    clearFileError,
  } = useUploadPhase((text, name) => {
    sqlActions.handleUploadComplete(text, name);
  });

  // 2. Custom hook for handling SQL parsing state and actions
  const { state: sqlState, actions: sqlActions } = useSqlAnalyzer();

  // Handle file error (from upload phase)
  const fileError = uploadFileError;

  // Derivasi Ikon dan Animasi UI Visual secara dinamis
  const ButtonIcon = getUploadPhaseMeta(isUploading ? uploadPhase : "idle").icon;
  const shouldSpin = isUploading && uploadPhase === "uploading";

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (isUploading) return;
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        if (fileInputRef.current) {
          fileInputRef.current.files = e.dataTransfer.files;
          const event = new Event("change", { bubbles: true });
          fileInputRef.current.dispatchEvent(event);
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isUploading]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:p-8">
        <div className="relative mb-8 sm:mb-14 overflow-hidden rounded-[40px] border border-white/50 bg-white/75 p-5 sm:p-6 md:p-8 shadow-[0_30px_90px_rgba(99,102,241,0.14)] backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_28%)]" />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span>SQL Dump Analyzer Experience</span>
              </div>
              <h1 className="mt-5 text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">Analisis file SQL dengan UI yang lebih hidup, cepat, dan interaktif.</h1>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">Upload dump SQL atau tempel isi file langsung. Sistem akan memetakan tabel, mendeteksi tipe database, menampilkan row lengkap, pagination, sorting, dan tampilan yang lebih colorful dengan animasi halus.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge className="rounded-full bg-sky-500 p-4 text-white shadow-md hover:bg-sky-600">Interaktif</Badge>
                <Badge className="rounded-full bg-violet-500 p-4 text-white shadow-md hover:bg-violet-600">Animated</Badge>
                <Badge className="rounded-full bg-emerald-500 p-4 text-white shadow-md hover:bg-emerald-600">Data-rich</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[460px] lg:my-8">
              <div className="flex flex-col gap-3 sm:gap-4">
                <HeroInfoCard icon={Layers3} label="Mode tampilan" value="Colorful" sublabel="Gradien, blur, dan depth" accent="from-sky-500 to-cyan-500" />
                <HeroInfoCard icon={Zap} label="Interaksi" value="Micro UI" sublabel="Hover, expand, sorting, pagination" accent="from-violet-500 to-fuchsia-500" />
              </div>
              <div className="flex flex-col gap-3 sm:gap-4 lg:mt-8">
                <HeroInfoCard icon={FileUp} label="Input" value="SQL File" sublabel="Upload atau paste langsung" accent="from-emerald-500 to-teal-500" />
                <HeroInfoCard icon={ScanSearch} label="Analisa" value="Auto Detect" sublabel="Tipe proyek & struktur tabel" accent="from-amber-500 to-orange-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Card className="h-full overflow-hidden rounded-[32px] md:rounded-[40px] border-white/50 bg-white/80 ring-0 shadow-[0_25px_80px_rgba(59,130,246,0.14)] backdrop-blur-sm px-4 py-6 sm:p-6">
              <CardHeader className="p-0">
                <div className="flex items-start gap-3">
                  <motion.div whileHover={{ rotate: 6, scale: 1.06 }} className="shrink-0 rounded-[14px] bg-linear-to-br from-sky-500 to-violet-500 p-3 md:p-4 text-white shadow-xl">
                    <Database className="h-5 w-5 md:h-6 md:w-6" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">SQL Dump Analyzer</CardTitle>
                    <CardDescription className="mt-1 text-xs md:text-sm text-slate-500 leading-relaxed">
                      Upload file <code className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] md:text-xs text-white">.sql</code> lalu aplikasi akan menganalisis jumlah tabel, nama tabel, jumlah kolom, dan menampilkan seluruh row dengan pagination per tabel.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-full bg-linear-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-sky-600 hover:to-violet-600 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-90 cursor-pointer px-4 py-2 border-none h-9"
                  >
                    {shouldSpin ? <ButtonIcon className="h-5 w-5 animate-spin" /> : isUploading ? <ButtonIcon className="h-5 w-5 animate-pulse" /> : <ButtonIcon className="h-5 w-5" />}
                    {isUploading ? uploadStatusText || "Mengupload file..." : "Upload File SQL"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      sqlActions.reset();
                      clearFileError();
                    }}
                    disabled={isUploading || (!sqlState.sqlText && !sqlState.fileName && !uploadFileError)}
                    className="rounded-full border-white/60 bg-white shadow-sm px-8 hover:bg-slate-50 h-9 cursor-pointer"
                  >
                    Reset
                  </Button>
                  <input type="file" accept=".sql" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>

                {fileError && <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm font-medium text-red-600 shadow-sm border border-red-100">{fileError}</div>}

                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Atau tempel isi SQL langsung</label>
                  </div>
                  <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white/80 transition-shadow focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
                    <Editor
                      height="240px"
                      width="100%"
                      language="sql"
                      theme="light"
                      value={sqlState.sqlText}
                      onChange={(val) => {
                        sqlActions.setSqlText(val || "");
                        if (uploadFileError) clearFileError();
                      }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        fontFamily: "var(--mono)",
                        lineHeight: 1.6,
                        padding: { top: 12, bottom: 12 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        formatOnPaste: true,
                        suggestOnTriggerCharacters: true,
                        scrollbar: {
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8,
                        },
                      }}
                      loading={<div className="flex w-full h-full items-center justify-center bg-slate-50 text-slate-400">Memuat editor...</div>}
                      beforeMount={(monaco) => {
                        if (!sqlState.sqlText) {
                          sqlActions.setSqlText(DEFAULT_SQL_PLACEHOLDER);
                        }
                        monaco.editor.defineTheme("custom-light", {
                          base: "vs",
                          inherit: true,
                          rules: [],
                          colors: {
                            "editor.background": "#ffffff",
                            "editor.lineHighlightBackground": "#f8fafc",
                          },
                        });
                      }}
                    />
                  </div>
                  {(!sqlState.sqlText || sqlState.sqlText === DEFAULT_SQL_PLACEHOLDER) && <p className="mt-3 text-xs text-slate-500">Mendukung format dump dari MySQL, MariaDB, dll.</p>}
                </div>
                {isUploading && <UploadProgressPanel uploadProgress={uploadProgress} uploadStatusText={uploadStatusText} uploadPhase={uploadPhase} PhaseIcon={ButtonIcon} />}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full rounded-[32px] md:rounded-[40px] ring-0 border-white/50 bg-white shadow-[0_25px_80px_rgba(139,92,246,0.14)] px-4 py-6 sm:p-6">
              <CardHeader className="p-0" >
                <div className="flex items-start gap-3">
                  <motion.div whileHover={{ rotate: 6, scale: 1.06 }} className="shrink-0 rounded-[14px] bg-linear-to-br from-sky-500 to-violet-500 p-3 text-white shadow-xl">
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">Format Analisis</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Versi ini menampilkan data tabel penuh dengan pagination dan interaksi visual yang lebih modern.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600 p-0">
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
          </div>
        </div>

        <div>
          {isUploading ? (
            <EmptyState isUploading={true} uploadStatusText={uploadStatusText} uploadPhase={uploadPhase} />
          ) : sqlState.parsedError ? (
            <ParseErrorState message={sqlState.parsedError} />
          ) : sqlState.parsedAnalysis ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-10">
              <section className="space-y-5">
                <HeroInfoCard icon={Database} label="Nama Database" value={sqlState.parsedAnalysis.databaseName} sublabel={sqlState.fileName !== "" ? `Berasal dari file: ${sqlState.fileName}` : "Berasal dari Paste Manual"} accent="from-indigo-600 via-violet-600 to-fuchsia-600" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={FileText} label="Jenis Proyek" value={sqlState.parsedAnalysis.projectType} sublabel="Terdeteksi Otomatis" accent="from-sky-500 to-blue-600" />
                  <StatCard icon={Layers3} label="Total Tabel" value={sqlState.parsedAnalysis.totalTables} sublabel={`${sqlState.parsedAnalysis.tablesWithSampleData} tabel berisi data`} accent="from-emerald-500 to-teal-600" />
                  <StatCard icon={Rows3} label="Total Baris Data" value={sqlState.parsedAnalysis.totalRows} sublabel="Seluruh row yang berhasil diparse" accent="from-amber-500 to-orange-600" />
                  <StatCard
                    icon={sqlState.parsedAnalysis.tablesWithSampleData === sqlState.parsedAnalysis.totalTables ? Eye : EyeOff}
                    label="Tabel Terisi Data"
                    value={`${sqlState.parsedAnalysis.tablesWithSampleData} dari ${sqlState.parsedAnalysis.totalTables}`}
                    accent="from-rose-500 to-pink-600"
                    sublabel={sqlState.parsedAnalysis.tablesWithSampleData === sqlState.parsedAnalysis.totalTables ? "Semua tabel memiliki sampel data" : "Beberapa tabel kosong (tanpa INSERT)"}
                  />
                </div>
                <Card className="rounded-[32px] md:rounded-[40px] border-white/50 bg-white/80 shadow-[0_25px_80px_rgba(59,130,246,0.14)] backdrop-blur-sm ring-0 px-4 py-6 sm:p-6">
                  <CardHeader className="p-0">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-2xl font-bold text-slate-900">Ringkasan Tabel</CardTitle>
                        <CardDescription className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                          Database bernama <strong>{sqlState.parsedAnalysis.databaseName}.sql</strong>. Berdasarkan nama tabel yang ditemukan, database ini paling mungkin digunakan untuk <strong>{sqlState.parsedAnalysis.projectType.toLowerCase()}</strong>.
                        </CardDescription>
                      </div>
                      <div className="min-w-[280px] rounded-[20px] bg-slate-50/80 p-4">
                        <div className="mb-2 flex items-center justify-between gap-1 text-xs sm:text-sm text-slate-600">
                          <span>Kepadatan tabel berisi data</span>
                          <span className="font-semibold text-slate-900">{Math.round((sqlState.parsedAnalysis.tablesWithSampleData / Math.max(sqlState.parsedAnalysis.totalTables, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(sqlState.parsedAnalysis.tablesWithSampleData / Math.max(sqlState.parsedAnalysis.totalTables, 1)) * 100} className="**:data-[slot=progress-track]:h-2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SummaryTable tables={sqlState.parsedAnalysis.tables} />
                  </CardContent>
                </Card>
              </section>

              <section className="space-y-5">
                <Card className="rounded-[32px] sm:rounded-[40px] border border-white/50 bg-white shadow-[0_25px_80px_rgba(59,130,246,0.14)] ring-0 px-4 py-6 sm:p-6">
                  <CardHeader className="p-0">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">View Tabel</CardTitle>
                        <CardDescription className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">Cari nama tabel atau kolom, lalu buka panel tabel yang ingin dilihat. Semua row yang berhasil diparse tersedia lewat pagination.</CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input value={sqlState.search} onChange={(e) => sqlActions.setSearch(e.target.value)} placeholder="Cari tabel atau kolom..." className="w-full rounded-2xl border-white/60 bg-white/80 pl-9 shadow-sm transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
                        </div>
                        <Button variant="outline" className="shrink-0 gap-2 rounded-2xl border-white/60 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:bg-white" onClick={sqlState.allExpanded ? sqlActions.handleCollapseAll : sqlActions.handleExpandAll}>
                          {sqlState.allExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {sqlState.allExpanded ? "Tutup Semua" : "Buka Semua"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4 mt-4">
                      {sqlState.filteredTables.length > 0 ? (
                        sqlState.filteredTables.map((table) => <TablePreview key={table.name} table={table} expanded={!!sqlState.expanded[table.name]} onToggle={() => sqlActions.toggleExpand(table.name)} />)
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 sm:px-6 py-10 text-center text-slate-500 text-sm">Tidak ada tabel atau kolom yang cocok dengan pencarian "{sqlState.search}".</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
