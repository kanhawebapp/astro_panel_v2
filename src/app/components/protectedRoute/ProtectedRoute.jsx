"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_CURRENT_ASTROLOGER = gql`
  query GetCurrentAstrologer {
    getCurrentAstrologer {
      name
      contactNo
    }
  }
`;

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  const { loading, data, error } = useQuery(GET_CURRENT_ASTROLOGER, {

    fetchPolicy: "network-only",
    errorPolicy: "all",
    context: {
      fetchOptions: {
        credentials: "include",
      },
    },
  });
 useEffect(() => {
    if (loading) return;

    if (error || !data?.getCurrentAstrologer) {
      router.replace("/");
    }
  }, [loading, error, data, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !data?.getCurrentAstrologer) {
    return null;
  }

  return children;
}
