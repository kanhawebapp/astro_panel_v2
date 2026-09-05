import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import API_BASE_URL from "../apiConfig";
import { API_END_POINT, LOCAL_STORAGE_KEY } from "@/constant";

export const astroChatApi = createApi({
  reducerPath: "astroChatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    // prepareHeaders: (headers, { getState }) => {
    //   const token =
    //     getState().auth?.accessToken ||
    //     (typeof window !== "undefined" &&
    //       localStorage.getItem(LOCAL_STORAGE_KEY.ACCESS_TOKEN));
    //   if (token) {
    //     headers.set("Authorization", `Bearer ${token}`);
    //   }
    //   return headers;
    // },
  }),
  endpoints: (builder) => ({
    postLiveChat: builder.mutation({
      query: ({ roomid, astroid }) => {
        const endpoints = API_END_POINT();
        return {
          url: endpoints.LIVE_CHAT, 
          method: "POST",
          body: { roomid, astroid },
        };
      },
    }),
  }),
});

export const { usePostLiveChatMutation } = astroChatApi;

export default astroChatApi;