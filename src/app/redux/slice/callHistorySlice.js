import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const expertCallApi = createApi({
  reducerPath: "expertCallApi",
  baseQuery: baseQueryWithErrorHandling,
  
  endpoints: (builder) => ({
    getExpertCallHistory: builder.query({
      query: ({ page = 1, per_page = 12 }) => {
        const endpoints = API_END_POINT();
        return{
          url: endpoints.CALL_HISTORY,
          params: { page, per_page },
        }
      
      },
      refetchOnMountOrArgChange: true,
    }),
    
  }),
});

export const { useGetExpertCallHistoryQuery } = expertCallApi;
export default expertCallApi;
