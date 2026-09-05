import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithErrorHandling from "./baseQuery";

export const offerPriceApi = createApi({
  reducerPath: "offerPriceApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["OfferPrice"],

  endpoints: (builder) => ({

    // 🔹 GET offer details (call on page load)
    getOfferPrice: builder.query({
      query: (astroid) => ({
        url: "expert-get-offer-price-status",
        method: "POST",
        body: { astroid },
      }),
      providesTags: ["OfferPrice"],
    }),

    // 🔹 UPDATE offer status (call on toggle)
    updateOfferPrice: builder.mutation({
      query: ({ astroid, status }) => ({
        url: "expert-offerprice",
        method: "POST",
        body: {
          astroid,
        },
      }),
      invalidatesTags: ["OfferPrice"],
    }),
  }),
});

export const {
  useGetOfferPriceQuery,
  useUpdateOfferPriceMutation,
} = offerPriceApi;
