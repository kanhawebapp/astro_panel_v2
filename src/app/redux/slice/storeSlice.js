
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL, { API_ENDPOINTS } from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const storeApi = createApi({
  reducerPath: "storeApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getStore: builder.query({
      query: () => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.STORE_HISTORY,
         
        };
      },
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const { useGetStoreQuery } = storeApi;
export default storeApi;
