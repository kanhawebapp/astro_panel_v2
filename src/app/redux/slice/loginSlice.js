import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_BASE_URL from '../apiConfig';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({

    login: builder.mutation({
      query: (credentials) => ({
        url: 'signin',
        method: 'POST',
        body: credentials,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
    }),
  }),
});
export const { useLoginMutation, useLogoutMutation } = authApi;