                  
import ArticleStatusRenderer from './ArticleStatusRenderer';
import EditArticleRenderer from './EditArticleRenderer';
import TextRenderer from './TextRenderer';
import { articleTitleFormatter, dateFormatter, textFormatter } from './Utils';


export const columnDefs = [
  {
    headerName: 'ARTICLE TITLE',
    field: 'title',
    cellRenderer: TextRenderer,
    valueFormatter: articleTitleFormatter,
    flex: 3,
  },
  { headerName: 'SECTOR', field: 'primarySector', valueFormatter: textFormatter },
  { field: 'status', cellRenderer: ArticleStatusRenderer, valueFormatter: textFormatter },
  { field: 'marketer', valueFormatter: textFormatter },
  { headerName: 'Created', field: 'createdDate', valueFormatter: dateFormatter },
  {
    headerName: '',
    field: 'view',
    headerHeight: 0,
    cellRenderer: EditArticleRenderer,
    cellStyle: { justifyContent: 'center' },
    maxWidth: 40, // Fixed casing issue
  },
];
