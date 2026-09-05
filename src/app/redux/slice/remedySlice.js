import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const remedyApi = createApi({
  reducerPath: "remedyApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getRemedyApi: builder.query({
      query: ({ page = 1 }) => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.REMEDY,
          params: { page },
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    
  }),
});

export const { useGetRemedyApiQuery } = remedyApi;
export default remedyApi;
