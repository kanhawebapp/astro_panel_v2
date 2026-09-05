"use client";

import {
  ApolloClient,
  InMemoryCache,
  from,
  makeVar,
} from "@apollo/client";

import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client/utilities";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";
import { CombinedGraphQLErrors } from "@apollo/client/errors";



const GRAPHQL_URL = "https://dhwaniastro.com/astroAuth/graphql";

// ------------------------------------------------
// Upload Link
// ------------------------------------------------

const uploadLink = new UploadHttpLink({
  uri: GRAPHQL_URL,
  credentials: "include",
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

// ------------------------------------------------
// Authorization Header
// ------------------------------------------------



// ------------------------------------------------
// Refresh Mutation
// ------------------------------------------------

const refreshAccessToken = async () => {
  console.log("Refreshing access token...");

  const response = await fetch(GRAPHQL_URL, {
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
  });

  const result = await response.json();

  if (result.errors) {
    return false;
  }

  return true;
};

// ------------------------------------------------
// Refresh Queue
// ------------------------------------------------

let isRefreshing = false;
let pendingRequests = [];

// ------------------------------------------------
// Error Link
// ------------------------------------------------

const errorLink = onError(({ error, operation, forward }) => {
  if (!(error instanceof CombinedGraphQLErrors)) {
    return;
  }

  const unauthenticated = error.errors.some(
    (e) => e.extensions?.code === "UNAUTHENTICATED"
  );

  if (!unauthenticated) {
    return;
  }

  console.log("Need Refresh");

  return new Observable((observer) => {
   const retry = () => {
  forward(operation).subscribe({
    next: (value) => observer.next(value),
    error: (err) => observer.error(err),
    complete: () => observer.complete(),
  });
};

    if (!isRefreshing) {
      isRefreshing = true;

      refreshAccessToken()
        .then((newToken) => {
          isRefreshing = false;

          console.log("Refresh Result:", newToken);

          if (!newToken) {
            localStorage.removeItem("astro_user");
            window.location.href = "/";
            return;
          }

          pendingRequests.forEach((cb) => cb(newToken));
          pendingRequests = [];

          retry();
        })
        .catch((err) => {
          console.log(err);

          isRefreshing = false;

          localStorage.removeItem("astro_user");

          window.location.href = "/";
        });
    } else {
      pendingRequests.push((token) => retry());
    }
  });
});
// ------------------------------------------------
// Apollo Client
// ------------------------------------------------

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([
    errorLink,
    uploadLink,
  ]),
});

export default client;
