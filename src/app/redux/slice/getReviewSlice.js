import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const getReviewApi = createApi({
  reducerPath: "getReviewApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getReviewApi: builder.query({
      query: ({ page = 1, per_page = 12 }) => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.GET_REVIEW,
          params: { page, per_page },
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    postReply: builder.mutation({
      query: ({ review_id, astroreply }) => ({
        url: "submit-reply",
        method: "POST",
        body: { review_id, astroreply },
      }),
    }),
    deleteReply: builder.mutation({
      query: ({ review_id }) => ({
        url: "delete-reply",
        method: "POST",
        body: { review_id },
      }),
    }),
  }),
});

export const {
  useGetReviewApiQuery,
  usePostReplyMutation,
  useDeleteReplyMutation,
} = getReviewApi;
export default getReviewApi;
