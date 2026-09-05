import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";



export const expertChatApi = createApi({
  reducerPath: "expertChatApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getExpertChatHistory: builder.query({
      query: ({ user_id, page = 1, per_page = 12 }) => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.CHAT_HISTORY,
          params: { expert_id: user_id, page, per_page },
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    
    suggestRemedy: builder.mutation({
      query: ({ Suggrem, request_session_id }) => ({
        url: `saves-suggestion`,
        method: "POST",
        body: {
          Suggrem,
          request_session_id,
        },
      }),
    }),
  }),
});

export const {
  useGetExpertChatHistoryQuery,
  useSuggestRemedyMutation,
} = expertChatApi;

export default expertChatApi;
