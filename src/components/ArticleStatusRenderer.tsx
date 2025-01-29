import type { CustomCellRendererProps } from '@ag-grid-community/react';
import React from 'react';
import classNames from 'classnames';
import styles from './articleStatusStyle.scss';

const ArticleStatusRenderer = (params: CustomCellRendererProps) => {
  const statusClassName = () => params.value?.toLowerCase().replace(/\s/g, '') || 'default';

  return (
    <span className={classNames(styles.articlestatus, styles[statusClassName()])}>
      {params.value}
    </span>
  );
};

export default ArticleStatusRenderer;
