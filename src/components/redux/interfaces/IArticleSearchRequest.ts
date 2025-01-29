export interface IArticleSearchRequest {
  articleId: string;        // Consider if this should be optional
  articleTitle: string;     // Consider if this should be optional
  sectors: string[];
  subSectors: string[];
  types: string[];
  subTypes: string[];
  statuses: string[];
  locations: string[];
  from: string;  // Alternatively, you could use `Date` if you're working with actual Date objects
  to: string;    // Same as `from`, `Date` might be a better choice
  pageStart: number;
  pageSize: number;
}
