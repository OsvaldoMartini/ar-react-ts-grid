import React from 'react';
import { CustomCellRendererProps } from '@ag-grid-community/react';

const TextRenderer = (params: CustomCellRendererProps) => {
  return (
    <p
      style={{
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {params.value}
    </p>
  );
};

export default TextRenderer;
