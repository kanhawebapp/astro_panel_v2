import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { LOCAL_STORAGE_KEY } from "@/constant";
const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: "https://webdemonew.dhwaniastro.co.in/api/",
    prepareHeaders: (headers, { getState }) => {
        let token;
        try {
            token =
                getState().auth?.accessToken ??
                (typeof window !== "undefined"
                    ? localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN)
                    : null);
        } catch {
            token = null;
        }

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});
export const kundaliApi = createApi({
    reducerPath: "kundaliApi",
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getKundali: builder.query({
            query: (request_session_id) => `get-kundali?request_session_id=${request_session_id}`,
        }),
    }),
});

export const { useGetKundaliQuery } = kundaliApi;
export default kundaliApi;
