export type OCRTestRow = {
  definedName: string;
  quality: string;
  tag: string;
  domText: string;
  ocrText: string;
  xPath: string;
};

export type OCRTestResult = {
  source: string;
  wordCount: number;
  counts: Record<string, number>;
  rows: OCRTestRow[];
  annotatedImage?: string;
};
