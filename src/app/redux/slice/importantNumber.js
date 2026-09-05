import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { LOCAL_STORAGE_KEY } from "@/constant";
import { API_END_POINT } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const importantNumberApi = createApi({
  reducerPath: "importantNumberApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getimportantNumberApi: builder.query({
      query: () => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.IMPORTANT_CONTACT,
          method: "GET",
        };
      },
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const { useGetimportantNumberApiQuery} = importantNumberApi;
export default importantNumberApi;
