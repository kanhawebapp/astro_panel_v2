"use client";

import { useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

import {
  Search,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  MessageSquare,
} from "lucide-react";

const GET_ASTROLOGER_EARNINGS = gql`
  query GetAstrologerEarnings {
    getAstrologerEarnings {
      summary {
        totalEarnings
        totalWithdrawn
        currentBalance
        totalSessions
        totalChatMinutes
      }

      transactions {
        id
        type
        amount
        coins
        description
        sessionId
        createdAt
      }
    }
  }
`;

export default function AstrologerEarnings() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, loading, error } = useQuery(GET_ASTROLOGER_EARNINGS, {
    fetchPolicy: "network-only",
  });

  const earnings = data?.getAstrologerEarnings;

  // SEARCH + FILTER
  const filteredTransactions = useMemo(() => {
    if (!earnings?.transactions) return [];

    return earnings.transactions.filter((item) => {
      const matchesSearch =
        item?.description?.toLowerCase().includes(search.toLowerCase()) ||
        item?.id?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [earnings, search, typeFilter]);
  const totalPages = Math.ceil(filteredTransactions.length / limit);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, page]);

  const summary = earnings?.summary;

  if (error) {
    return <div className="p-6 text-red-500">Error loading earnings</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f3fb] p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-2xl font-bold text-gray-800">
          Astrologer Earnings
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Earnings</span>

            <Wallet className="w-5 h-5 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-gray-800">
            ₹{summary?.totalEarnings || 0}
          </h2>
        </div>

        <div className="bg-violet-300 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Withdrawn</span>

            <ArrowUpCircle className="w-5 h-5 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-gray-800">
            ₹{summary?.totalWithdrawn || 0}
          </h2>
        </div>

        <div className="bg-violet-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Balance</span>

            <ArrowDownCircle className="w-5 h-5 text-blue-500" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-gray-800">
            ₹{summary?.currentBalance || 0}
          </h2>
        </div>

        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Sessions</span>

            <MessageSquare className="w-5 h-5 text-purple-500" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-gray-800">
            {summary?.totalSessions || 0}
          </h2>
        </div>

        <div className="bg-violet-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Chat Minutes</span>

            <Clock className="w-5 h-5 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold mt-3 text-gray-800">
            {summary?.totalChatMinutes || 0}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search by description or transaction ID..."
              value={search}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300  shadow-2xl  rounded-full pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* FILTER */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 text-xs rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-black"
          >
            <option value="ALL">All Types</option>

            <option value="CREDIT">Credit</option>

            <option value="DEBIT">Debit</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-ggray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-purple-400">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  ID
                </th>

                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  Type
                </th>

                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  Amount
                </th>

                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  Description
                </th>

                <th className="text-left p-3 text-sm font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Loading earnings...
                  </td>
                </tr>
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-200 text-xs hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2 flex flex-col gap-1 text-xs font-medium text-gray-700">
                      <span>Session ID : {item.sessionId?.slice(0, 8)} </span>
                      <span>Transaction ID : {item.id?.slice(0, 8)} </span>
                    </td>

                    <td className="px-4 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs  ${
                          item.type === "CREDIT"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="px-4 py-2 font-semibold text-gray-700">
                      ₹ {item.amount}
                    </td>

                    <td className="px-4 py-2 text-gray-600">
                      {item.description}
                    </td>

                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-5">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`w-10 h-10 border rounded-lg ${
                  page === pageNumber
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {pageNumber}
              </button>
            ),
          )}

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
