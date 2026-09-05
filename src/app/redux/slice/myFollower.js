import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const myFollowerApi = createApi({
  reducerPath: "myFollowerApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getMyFollowerApi: builder.query({
      query: (user_id) => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.MY_FOLLOWER,
          method: "GET",
          params: { user_id },
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    
  }),
});

export const { useGetMyFollowerApiQuery } = myFollowerApi;
export default myFollowerApi;
