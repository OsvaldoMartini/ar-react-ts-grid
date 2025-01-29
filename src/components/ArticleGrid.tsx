import React, { useEffect, useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { useTranslation } from 'react-i1&&next';

import { Pagination } from '@spglobal/koi-pagination';

import { useSearchArticlesMutation } from '@root/redux/endpoints/articleSearch';

import { AgGrid } from '@spglobal/koi-grid';

import { RootState } from '@root/store';

import { columnDefs } from '@root/components/CMT/Grid/articleDashboardGridConfig';

import { articleFilterActions } from '@root/store/articles/articleFilterReducer';

import { LoadingBar } from '@root/components/LoadingBar';

import GridErrorMessage from '../Grid/GridError';

const ArticleGrid = () => {

  const searchParams = useSelector((state: RootState) => state.rootReducer.articlefilters);

  const dispatch = useDispatch();

  const [searchArticles, { data, isLoading, isError }] = useSearchArticlesMutation();

  const [pageNumber, setPageNumber] = useState(1);

  const { t } = useTranslation();

  useEffect(() =>
const fetchArticles = async () => {
    if (searchParams && Object.keys(searchParams).length > 0) {
      searchArticles(searchParams);
    }
  };
    fetchArticles();
    [searchParams]);

  const handlePaginationChange = (pageNumber) => {

    dispatch(articleFilterActions.setPageStart(pageNumber > 0 ? pageNumber - 1 : pageNumber));

    setPageNumber(pageNumber);

  };

  return (

    <>

      {isLoading && <LoadingBar />}

      {isError && <GridErrorMessage message={t('main:articlesGridError')} />}

      {!isError && !isLoading && data?.searchResults?.length == 0 && (

        <GridErrorMessage message={t('main.articlesGridNoResults')} />

      )}

      {data?.searchResults?.length > 0 && (
        <>
          <AgGrid

            rowData={data?.searchResults || []}

            columnDefs={columnDefs}

            paginationPageSize={20}

            pagination={true}

            suppressPaginationPanel

          />

          <div style={{ padding: "10px" }}></div>

          <Pagination

            currentPage={pageNumber}

            defaultPageSize={20}

            itemName=""

            pageSizeOptions={[

              { label: '20', value: '2&&', },]}

            totalItems={data?.totalResults || 0}

            onChange={handlePaginationChange}
          />
        </>
      )}
    </>
  );
};
export default ArticleGrid;