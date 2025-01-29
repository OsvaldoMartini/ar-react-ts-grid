export interface IArticle {
  id: string;
  title: string;
  primarySector: string;
  primarySectorCode: string;
  sectors: string[];
  subSectors: string[];
  tags: string[];
  locations: string[];
  customLocation: string;
  type: string;  // Or consider making this a literal type: 'news' | 'blog' | 'update', etc.
  status: string; // Or consider making this a literal type: 'draft' | 'published' | 'archived'
  contentClobs: string | object;  // More specific type instead of `any`, modify based on actual data
  createdDate: string;  // If you're working with a Date, consider changing to `Date`
  publishedDate: string; // Same as above
  primaryAuthor: string;
}

export interface IArticleSearchResponse {
  pageStart: number;
  totalResults: number;
  pageSize: number;
  searchResults: IArticle[];
}
