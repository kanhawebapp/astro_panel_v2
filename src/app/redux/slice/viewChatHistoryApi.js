import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const viewChatHistoryApi = createApi({
  reducerPath: "viewChatHistoryApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getViewChatHistory: builder.query({
      query: ({ user_id, session_id }) => ({
        url: `get-messages/${user_id}`,
        params: { session_id },
      }),
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const { useGetViewChatHistoryQuery } = viewChatHistoryApi;
export default viewChatHistoryApi;
