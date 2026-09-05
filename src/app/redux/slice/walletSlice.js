import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";
import baseQueryWithErrorHandling from "./baseQuery";

export const walletApi = createApi({
  reducerPath: "walletApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    getWalletTransactions: builder.query({
      query: ({ page = 1, per_page, filter = "all", user_id, from_date, to_date }) => {
        const endpoints = API_END_POINT();
        const params = { page, per_page, filter };

        if (user_id) params.user_id = user_id;
        if (filter === "custom_range" && from_date && to_date) {
          params.from_date = from_date;
          params.to_date = to_date;
        }

        return {
          url: endpoints.WALLET,
          params,
        };
      },
      transformResponse: (response) => {
        return {
          transactions: response.recordList,
          summary: {
            totalPaidAmount: Number(response.totalPaidAmount),
            totalPGAmount: Number(response.totalPGAmount),
            totalTDSAmount: Number(response.totalTDSAmount),
            totalEarningAmount: Number(response.totalEarningAmount),
          },
          summaryByProductType: response.summaryByProductType || {},
          pagination: response.pagination,
        };
      },
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const { useGetWalletTransactionsQuery } = walletApi;
export default walletApi;
