export type ParsedRow = Record<string, unknown>;

export type ParsedTable = {
  no: number;
  name: string;
  columns: string[];
  columnCount: number;
  hasSampleData: boolean;
  rowCount: number;
  sampleRows: ParsedRow[];
};

export type AnalysisResult = {
  databaseName: string;
  projectType: string;
  totalTables: number;
  tablesWithSampleData: number;
  totalRows: number;
  tables: ParsedTable[];
};

export type UploadPhase =
  | "idle"
  | "uploading"
  | "preparing"
  | "reading"
  | "scanning"
  | "analyzing"
  | "building"
  | "finishing";
