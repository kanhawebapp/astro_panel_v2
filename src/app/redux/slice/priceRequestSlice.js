import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const priceRequestApi = createApi({
  reducerPath: "priceRequestApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getPriceRequestApi: builder.query({
      query: (page = 1) => `astro-prices?page=${page}`,
      transformResponse: (response) => ({
        data: response.priceHistory,
        pagination: response.pagination_data,
      }),
    }),
    addPriceRequest: builder.mutation({
      query: (newRequestData) => ({
        url: "astro-price/store",
        method: "POST",
        body: newRequestData,
      }),
    }),
    getKundaliApi: builder.query({
      query: (request_session_id) => `get-kundali?request_session_id=${request_session_id}`,
    }),
  }),
});

export const { useGetPriceRequestApiQuery, useAddPriceRequestMutation,  useGetKundaliApiQuery } = priceRequestApi;
export default priceRequestApi;
