"use client";

import { ApolloProvider } from "@apollo/client/react";
import { useEffect } from "react";
import client from "../../utils/apolloClient";

export default function ApolloWrapper({ children }) {

 

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}