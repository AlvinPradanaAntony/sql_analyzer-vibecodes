import { useState } from "react";
import type { UploadPhase } from "../types/sql";
import { readFileAsText, sleep, getUploadPhaseMeta } from "../lib/upload-phase";

export function useUploadPhase(onUploadComplete: (text: string, fileName: string) => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [fileError, setFileError] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".sql")) {
      setFileError("Mohon upload file dengan ekstensi .sql");
      event.target.value = "";
      return;
    }

    setFileError("");
    setIsUploading(true);
    setUploadProgress(10);
    setUploadPhase("uploading");
    setUploadStatusText(getUploadPhaseMeta("uploading").text);

    // Sekuensi ilusi / gaya *perceived performance* UX
    const phaseSequence: Array<{ phase: UploadPhase; progress: number; wait: number }> = [
      { phase: "preparing", progress: 25, wait: 600 },
      { phase: "reading", progress: 40, wait: 600 },
      { phase: "scanning", progress: 60, wait: 800 },
      { phase: "analyzing", progress: 80, wait: 800 },
      { phase: "building", progress: 95, wait: 400 },
    ];

    try {
      // Pembacaan file dieksekusi asinkron sejak awal loop
      const fileTextPromise = readFileAsText(file);

      for (const step of phaseSequence) {
        const meta = getUploadPhaseMeta(step.phase);
        setUploadPhase(step.phase);
        setUploadStatusText(meta.text);
        setUploadProgress(step.progress);
        await sleep(step.wait);
      }

      // Pastikan pembacaan di *background* benar-benar selesai
      const text = await fileTextPromise;
      const finishingMeta = getUploadPhaseMeta("finishing");
      setUploadPhase("finishing");
      setUploadProgress(100);
      setUploadStatusText(finishingMeta.text);
      await sleep(500);

      onUploadComplete(text, file.name);
    } catch (err: any) {
      setFileError(err.message || "Gagal membaca file.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadPhase("idle");
      setUploadStatusText("");
      event.target.value = "";
    }
  };

  const clearFileError = () => {
    setFileError("");
  };

  return {
    isUploading,
    uploadProgress,
    uploadStatusText,
    uploadPhase,
    fileError,
    handleFileChange,
    clearFileError,
  };
}
