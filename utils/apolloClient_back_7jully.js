"use client";
import {
  ApolloClient,
  InMemoryCache,
  makeVar,
  from,
} from "@apollo/client";

import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

export const authTokenVar = makeVar(
  typeof window !== "undefined"
    ? localStorage.getItem("astro_token")
    : null
);

const uploadLink = new UploadHttpLink({
  uri: "https://dhwaniastro.com/astroAuth/graphql",
  credentials: "include",
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

// ---------------- REFRESH TOKEN ----------------

const refreshAccessToken = async () => {
  try {
    const response = await fetch(
      "https://dhwaniastro.com/astroAuth/graphql",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation {
              refreshAstrologerToken {
                accessToken
              }
            }
          `,
        }),
      }
    );

    const result = await response.json();

    return result?.data?.refreshAstrologerToken?.accessToken;
  } catch (error) {
    console.error("Refresh token failed", error);
    return null;
  }
};

// ---------------- AUTH HEADER ----------------

const authLink = setContext((_, { headers }) => {
  const token = authTokenVar();

  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// ---------------- AUTO REFRESH ----------------

let isRefreshing = false;
let pendingRequests = [];

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    const isUnauthenticated =
      graphQLErrors?.some(
        (err) =>
          err.extensions?.code === "UNAUTHENTICATED" ||
          err.message?.includes("jwt") ||
          err.message?.includes("Unauthorized")
      ) ||
      networkError?.statusCode === 401;

    if (!isUnauthenticated) {
      return;
    }

    if (!isRefreshing) {
      isRefreshing = true;

      return new Promise((resolve) => {
        refreshAccessToken()
          .then((newToken) => {
            isRefreshing = false;

            if (!newToken) {
              localStorage.removeItem("astro_token");
              localStorage.removeItem("astro_user");

              window.location.href = "/";
              return;
            }

            localStorage.setItem("astro_token", newToken);

            authTokenVar(newToken);

            pendingRequests.forEach((cb) => cb(newToken));
            pendingRequests = [];

            operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
            }));

            resolve(forward(operation));
          })
          .catch(() => {
            isRefreshing = false;

            localStorage.removeItem("astro_token");
            localStorage.removeItem("astro_user");

            window.location.href = "/";
          });
      });
    }

    return new Promise((resolve) => {
      pendingRequests.push((token) => {
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        }));

        resolve(forward(operation));
      });
    });
  }
);

// ---------------- CLIENT ----------------

const client = new ApolloClient({
  link: from([
    errorLink,
    authLink,
    uploadLink,
  ]),
  cache: new InMemoryCache(),
});

export default client;