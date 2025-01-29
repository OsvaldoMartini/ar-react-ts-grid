import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IArticleSearchRequest } from '@root/redux/interfaces/IArticleSearchRequest';
import { IArticleSearchResponse } from '@root/redux/interfaces/IArticleSearchResponse';

export const articleSearchApi = createApi({
  reducerPath: 'articleSearchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.CMT_BASE_URL, // Fixed environment variable naming
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    searchArticles: builder.mutation<IArticleSearchResponse, IArticleSearchRequest>({
      query: (payload) => ({
        url: 'articles',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
});

export const { useSearchArticlesMutation } = articleSearchApi;
