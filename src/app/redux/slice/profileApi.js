import { createApi} from "@reduxjs/toolkit/query/react";
// import API_BASE_URL from "../apiConfig";
import { API_END_POINT } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: baseQueryWithErrorHandling, 
  endpoints: (builder) => ({
    getExpertProfileDetails: builder.query({
      query: () => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.ASTRO_PROFILE,
        };
      },
      refetchOnMountOrArgChange: true,
    }),
    getOnlineDetails: builder.query({
      query: () => `online-status`,
    }),
    updateExpertStatus: builder.mutation({
      query: (body) => ({
        url: `expert/update-status`,
        method: "POST",
        body,
      }),
    }),
    fetchPromoStatus: builder.query({
      query: () => ({
        url: `expert/update-status?type=is_promotional`,
        method: "POST",
        body: {},
      }),
    }),
  }),
});

export const {
  useGetExpertProfileDetailsQuery,
  useGetOnlineDetailsQuery,
  useUpdateExpertStatusMutation,
  useFetchPromoStatusQuery,
} = profileApi;

export default profileApi;