
// import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import API_BASE_URL from "../apiConfig";
// import { LOCAL_STORAGE_KEY } from "@/constant";


// let hasShownAlert = false;

// const baseQueryWithAuth = fetchBaseQuery({
//     baseUrl: API_BASE_URL,
//     prepareHeaders: (headers, { getState }) => {
//         let token;
//         try {
//             token =
//                 getState().auth?.accessToken ??
//                 (typeof window !== "undefined"
//                     ? localStorage.getItem("astro_token")
//                     : null);
//         } catch {
//             token = null;
//         }

//         if (token) {
//             headers.set("Authorization", `Bearer ${token}`);
//         }
//         return headers;
//     },
// });

// const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
//     const result = await baseQueryWithAuth(args, api, extraOptions);


//     const isTokenError =
//         result?.error &&
//         (result.error.status === 401 ||
//             (result.error.originalStatus === undefined && result.error.data === undefined));

//      if (isTokenError && typeof window !== "undefined" && !hasShownAlert) {
//         hasShownAlert = true;


//         alert("Session expired or another login detected. Please login again.");
//         localStorage.clear();

//         window.location.href = "/";

//     }

//     return result;
// };

// export default baseQueryWithErrorHandling;
