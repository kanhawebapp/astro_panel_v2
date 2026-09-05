
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const chatHistoryApi = createApi({
  reducerPath: "chatHistoryApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getChatBySessionId: builder.query({
      query: (sessionId) => `view-chat-history/${sessionId}`,
      transformResponse: (response) => ({
        rating: response.rating || 0,
        comment: response.comment || "",
        fromData: response.fromData || {},
        messages: Array.isArray(response.recordList) ? response.recordList : [],
      }),
    }),
  }),
});

export const { useGetChatBySessionIdQuery } = chatHistoryApi;
