import type { AnalysisResult, ParsedRow, ParsedTable } from "../types/sql";

export function normalizeWhitespace(value: unknown): string {
  if (value == null) return "NULL";
  return String(value).replace(/\s+/g, " ").trim();
}

export function truncateValue(value: unknown, max = 120): string {
  const text = normalizeWhitespace(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function maskSensitiveValue(columnName: string, value: unknown): unknown {
  const key = String(columnName || "").toLowerCase();
  if (key.includes("password") || key.includes("passwd") || key.includes("pwd")) {
    return value == null || value === "" ? "" : "••••••";
  }
  return value;
}

export function inferProjectType(tableNames: string[]): string {
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

export function inferDatabaseName(sqlText: string, fileName: string): string {
  const useMatch = sqlText.match(/USE\s+`?([^`\s;]+)`?\s*;/i);
  if (useMatch) return useMatch[1];

  const createDbMatch = sqlText.match(/CREATE\s+DATABASE(?:\s+IF\s+NOT\s+EXISTS)?\s+`?([^`\s;]+)`?/i);
  if (createDbMatch) return createDbMatch[1];

  if (fileName) return fileName.replace(/\.sql$/i, "");
  return "Tidak terdeteksi";
}

export function parseSqlLiteral(token: string | null | undefined): unknown {
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

export function splitRowValues(rowText: string): unknown[] {
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

export function extractCreateTables(sqlText: string) {
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

export function splitRows(valuesBlock: string): string[] {
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

export function extractInsertRows(
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

export function analyzeSql(sqlText: string, fileName = ""): AnalysisResult | null {
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

export function compareValues(a: unknown, b: unknown): number {
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
