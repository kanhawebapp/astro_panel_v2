import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getnotesApi: builder.query({
      query: (orderId) => `get-notes?request_session_id=${orderId}`,
    }),
    addNoteApi: builder.mutation({
      query: (noteData) => ({
        url: "callchat-notes",
        method: "POST",
        body: noteData,
      }),
    }),
  }),
});

export const { useGetnotesApiQuery, useAddNoteApiMutation } = notesApi;
export default notesApi;
