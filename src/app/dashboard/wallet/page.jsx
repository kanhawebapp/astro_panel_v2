"use client";

import { useMemo, useState } from "react";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

import {
  Search,
  Wallet,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  IndianRupee,
} from "lucide-react";

const GET_ASTROLOGER_WALLET_TRANSACTIONS = gql`
  query GetAstrologerWalletTransactions($page: Int!, $limit: Int!) {
    getAstrologerWalletTransactions(page: $page, limit: $limit) {
      success
      totalCount
      currentPage
      totalPages

      data {
        id
        type
        sessionId
        amount
        coins
        description
        createdAt
      }
    }
  }
`;

export default function WalletTransactions() {
  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [page, setPage] = useState(1);

  const limit = 10;

  // APOLLO QUERY
  const { data, loading, error } = useQuery(
    GET_ASTROLOGER_WALLET_TRANSACTIONS,
    {
      variables: {
        page,
        limit,
      },

      fetchPolicy: "network-only",
    },
  );

  const walletTransactions = data?.getAstrologerWalletTransactions;

  // SEARCH + FILTER
  const filteredTransactions = useMemo(() => {
    if (!walletTransactions?.data) return [];

    return walletTransactions.data.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        item?.id?.toLowerCase().includes(searchValue) ||
        item?.description?.toLowerCase().includes(searchValue) ||
        item?.type?.toLowerCase().includes(searchValue);

      const matchesType = typeFilter === "ALL" || item?.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [walletTransactions, search, typeFilter]);

  // TOTAL AMOUNT
  const totalAmount = filteredTransactions.reduce(
    (acc, item) => acc + (item.amount || 0),
    0,
  );

  if (error) {
    return (
      <div className="p-6 text-red-500">Error loading wallet transactions</div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3fb] p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Wallet Transactions
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Transactions</p>

            <Wallet className="w-5 h-5 text-blue-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {walletTransactions?.totalCount || 0}
          </h2>
        </div>

        {/* <div className="bg-violet-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Current Page</p>

            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {walletTransactions?.currentPage || 1}
          </h2>
        </div> */}

        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Pages</p>

            <Coins className="w-5 h-5 text-yellow-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {walletTransactions?.totalPages || 1}
          </h2>
        </div>

        <div className="bg-violet-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Amount</p>

            <IndianRupee className="w-5 h-5 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            ₹{totalAmount}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search by transaction ID, type or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300  shadow-2xl  rounded-full pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* FILTER */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 text-xs rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Types</option>

            <option value="CHAT_EARNING">CHAT_EARNING</option>

            <option value="CALL_EARNING">CALL_EARNING</option>

            <option value="WITHDRAWAL">WITHDRAWAL</option>

            <option value="BONUS">BONUS</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full ">
            <thead className="bg-purple-400">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                   ID
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Type
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Amount
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>

                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Loading wallet transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-200 text-xs hover:bg-gray-50 transition"
                  >
                    <td className="p-4 flex flex-col text-xs font-medium text-gray-700">
                      <span>SessionID : {item.sessionId?.slice(0, 8)}</span>

                      <span>TXN Id : {item.id?.slice(0, 8)}</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs  flex items-center gap-1 w-fit ${
                          item.type === "CHAT_EARNING" ||
                          item.type === "CALL_EARNING"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.type === "CHAT_EARNING" ||
                        item.type === "CALL_EARNING" ? (
                          <ArrowDownCircle className="w-2 h-2" />
                        ) : (
                          <ArrowUpCircle className="w-2 h-2" />
                        )}

                        {item.type}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                        ₹ {item.amount}
                      </div>
                    </td>

                    <td className="p-4 text-gray-600">{item.description}</td>

                    <td className="p-4 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No wallet transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            Page {walletTransactions?.currentPage || 1} of{" "}
            {walletTransactions?.totalPages || 1}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>

            <button
              disabled={page === walletTransactions?.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
