import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const dosaAndDontApi = createApi({
  reducerPath: "dosAndDontApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getdosAndDontApi: builder.query({
      query: () => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.DO_DONT,
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    
    getNoticeBoard: builder.query({
      query: () => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.NOTICES,
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    
  }),
});

export const {useGetdosAndDontApiQuery,  useGetNoticeBoardQuery } = dosaAndDontApi;
export default dosaAndDontApi;
