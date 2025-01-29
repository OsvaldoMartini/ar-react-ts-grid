import { ValueFormatterParams } from '@ag-grid-community/core';

export const articleTitleFormatter = (params: ValueFormatterParams) => {
  return params?.value?.trim() !== '' ? params.value : 'Untitled';
};

export const textFormatter = (params: ValueFormatterParams) => {
  return params?.value?.trim() !== '' ? params.value : '-';
};

export const dateFormatter = (params: ValueFormatterParams) => {
  if (!params?.value) {
    return '-';
  }

  const date = new Date(params.value);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
