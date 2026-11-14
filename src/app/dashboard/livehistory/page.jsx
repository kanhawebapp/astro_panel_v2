"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

 const GET_MY_LIVE_INTERACTION_HISTORY = gql`
  query GetMyLiveInteractionHistory(
    $searchInput: MyAstrologerLiveInteractionHistorySearchInput
  ) {
    getMyLiveInteractionHistory(searchInput: $searchInput) {
      data {
        sessionId
        liveStreamId
        userId
        userName
        astrologerId
        interactionType
        status
        ratePerMin
        chargedCoins
        astrologerEarned
        durationSeconds
        billableMinutes
        requestedAt
        acceptedAt
        startedAt
        endedAt
        createdAt
      }

      totalCount
      currentPage
      totalPages
      totalCoinsCollected
      totalAstrologerEarnings
      totalAudioCalls
      totalVideoCalls
    }
  }
`;

const formatDate = (date) => {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "-";

  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "-";

  return value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDuration = (seconds = 0) => {
  const totalSeconds = Number(seconds) || 0;

  if (totalSeconds < 60) return `${totalSeconds} sec`;

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return remainingSeconds
    ? `${minutes} min ${remainingSeconds} sec`
    : `${minutes} min`;
};

const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "ONGOING":
    case "ACCEPTED":
    case "STARTED":
      return "bg-yellow-100 text-yellow-700";

    case "CANCELLED":
    case "REJECTED":
    case "FAILED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const SummaryCard = ({ title, value, bg }) => (
  <div
    className={`${bg} p-3 sm:p-4 shadow flex items-center justify-between rounded-2xl`}
  >
    <p className="text-xs sm:text-sm text-gray-600">{title}</p>
    <h2 className="text-sm sm:text-xl font-bold text-gray-900">
      {value ?? 0}
    </h2>
  </div>
);

export default function MyLiveInteractionHistory() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const [filters, setFilters] = useState({
    userName: "",
    interactionType: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const { data, loading, error, refetch } = useQuery(
    GET_MY_LIVE_INTERACTION_HISTORY,
    {
      variables: {
        searchInput: {
          page: 1,
          limit,
        },
      },
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  const history = data?.getMyLiveInteractionHistory;
  const interactions = history?.data || [];

  // Current page filtering.
  const filteredInteractions = interactions.filter((item) => {
    const userMatch = (item?.userName || "")
      .toLowerCase()
      .includes(filters.userName.toLowerCase());

    const typeMatch = filters.interactionType
      ? item?.interactionType === filters.interactionType
      : true;

    const statusMatch = filters.status
      ? item?.status === filters.status
      : true;

    const date = item?.createdAt
      ? new Date(item.createdAt)
      : null;

    const startMatch = filters.startDate
      ? date && date >= new Date(`${filters.startDate}T00:00:00`)
      : true;

    const endMatch = filters.endDate
      ? date && date <= new Date(`${filters.endDate}T23:59:59.999`)
      : true;

    return (
      userMatch &&
      typeMatch &&
      statusMatch &&
      startMatch &&
      endMatch
    );
  });

  const handleSearch = () => {
    setPage(1);

    refetch({
      searchInput: {
        page: 1,
        limit,
      },
    });
  };

  const handleReset = () => {
    setFilters({
      userName: "",
      interactionType: "",
      status: "",
      startDate: "",
      endDate: "",
    });

    setPage(1);

    refetch({
      searchInput: {
        page: 1,
        limit,
      },
    });
  };

  const handlePageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > (history?.totalPages || 1)
    ) {
      return;
    }

    setPage(newPage);

    refetch({
      searchInput: {
        page: newPage,
        limit,
      },
    });
  };

  return (
    <div className="min-h-screen text-black p-0 sm:p-5 bg-gray-100">
      <div className="sm:p-5 p-3 bg-white shadow-xl rounded-3xl">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-3 mb-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-base sm:text-3xl font-bold text-purple-900">
              Live Interaction History
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Track your audio and video calls, coins collected and earnings.
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">

          <SummaryCard
            title="Total Interactions"
            value={history?.totalCount}
            bg="bg-violet-200"
          />

          <SummaryCard
            title="Coins Collected"
            value={history?.totalCoinsCollected}
            bg="bg-purple-200"
          />

          <SummaryCard
            title="My Earnings"
            value={`₹${history?.totalAstrologerEarnings ?? 0}`}
            bg="bg-green-100"
          />

          <SummaryCard
            title="Audio / Video"
            value={`${history?.totalAudioCalls ?? 0} / ${history?.totalVideoCalls ?? 0}`}
            bg="bg-blue-100"
          />

        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 mb-6 bg-white shadow md:grid-cols-5 rounded-2xl">

          <input
            type="text"
            placeholder="Search User Name"
            className="px-4 py-2 text-xs sm:text-sm border border-gray-300 placeholder:text-gray-400 rounded-full outline-none focus:border-purple-700"
            value={filters.userName}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                userName: e.target.value,
              }))
            }
          />

          <select
            className="px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-600 rounded-full outline-none"
            value={filters.interactionType}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                interactionType: e.target.value,
              }))
            }
          >
            <option value="">All Interaction Types</option>
            <option value="AUDIO">Audio Call</option>
            <option value="VIDEO">Video Call</option>
          </select>

          <select
            className="px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-600 rounded-full outline-none"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="ONGOING">Ongoing</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <input
            type="date"
            className="px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-600 rounded-full outline-none"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />

          <input
            type="date"
            className="px-4 py-2 text-xs sm:text-sm border border-gray-300 text-gray-600 rounded-full outline-none"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                endDate: e.target.value,
              }))
            }
          />

          <div className="flex gap-2 md:col-span-5">
            <button
              onClick={handleSearch}
              className="px-5 py-2 text-xs sm:text-sm text-white bg-purple-900 rounded-xl hover:bg-purple-800"
            >
              Search
            </button>

            <button
              onClick={handleReset}
              className="px-5 py-2 text-xs sm:text-sm text-purple-900 bg-purple-100 rounded-xl hover:bg-purple-200"
            >
              Reset
            </button>
          </div>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading interactions...
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-xl">
            Something went wrong while fetching interaction history.

            <button
              onClick={() => refetch()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredInteractions.length === 0 && (
          <div className="p-10 text-center bg-gray-50 rounded-2xl">
            <p className="text-sm font-semibold text-gray-700">
              No interactions found
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Your audio and video interaction records will appear here.
            </p>
          </div>
        )}

        {/* INTERACTION LIST */}
        {!loading && !error && (
          <div className="space-y-3">

            {filteredInteractions.map((interaction, index) => {
              const interactionDate =
                interaction?.requestedAt || interaction?.createdAt;

              return (
                <div
                  key={interaction?.sessionId || index}
                  className="p-3 sm:p-4 bg-purple-50 shadow-sm border border-purple-100 rounded-2xl"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row">

                    {/* LEFT */}
                    <div className="flex-1 min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                          {interaction?.userName || "Unknown User"}
                        </h2>

                        <span
                          className={`px-3 py-1 text-[10px] rounded-full ${
                            interaction?.interactionType === "VIDEO"
                              ? "bg-pink-200 text-pink-800"
                              : "bg-blue-200 text-blue-800"
                          }`}
                        >
                          {interaction?.interactionType || "-"} CALL
                        </span>

                        <span
                          className={`px-3 py-1 text-[10px] rounded-full ${getStatusStyle(
                            interaction?.status
                          )}`}
                        >
                          {interaction?.status || "-"}
                        </span>

                      </div>

                      <p className="mt-1 text-[10px] sm:text-xs text-gray-500 break-all">
                        Session ID: {interaction?.sessionId || "-"}
                      </p>

                      {/* DETAILS */}
                      <div className="flex flex-wrap gap-2 mt-3">

                        <span className="px-3 py-1 text-[10px] bg-violet-200 rounded-full">
                          Duration: {formatDuration(interaction?.durationSeconds)}
                        </span>

                        <span className="px-3 py-1 text-[10px] bg-purple-200 rounded-full">
                          Billable: {interaction?.billableMinutes ?? 0} min
                        </span>

                        <span className="px-3 py-1 text-[10px] bg-blue-200 rounded-full">
                          ₹{interaction?.ratePerMin ?? 0}/min
                        </span>

                        <span className="px-3 py-1 text-[10px] bg-red-100 text-red-700 rounded-full">
                          {interaction?.chargedCoins ?? 0} Coins Collected
                        </span>

                        <span className="px-3 py-1 text-[10px] bg-green-100 text-green-700 rounded-full">
                          ₹{interaction?.astrologerEarned ?? 0} Earned
                        </span>

                      </div>

                    

                      {/* IDS */}
                      <div className="mt-3 pt-3 border-t border-purple-100">
                        <p className="text-[10px] text-gray-400 break-all">
                          User ID: {interaction?.userId || "-"}
                        </p>

                        <p className="text-[10px] text-gray-400 break-all">
                          Astrologer ID: {interaction?.astrologerId || "-"}
                        </p>

                        <p className="text-[10px] text-gray-400 break-all">
                          Live Stream ID: {interaction?.liveStreamId || "-"}
                        </p>
                      </div>

                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 md:min-w-[140px]">

                      <div className="text-[10px] sm:text-xs text-gray-500 md:text-right">
                        <p>{formatDate(interactionDate)}</p>
                        <p>{formatTime(interactionDate)}</p>
                      </div>

                      <span className="px-3 py-2 text-xs font-semibold bg-green-100 text-green-700 rounded-xl">
                        ₹{interaction?.astrologerEarned ?? 0} Earned
                      </span>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* PAGINATION */}
        {!loading && !error && (history?.totalPages || 0) > 0 && (
          <div className="flex items-center justify-center gap-4 mt-8">

            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-4 py-2 text-xs sm:text-sm bg-white shadow rounded-xl disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-xs text-gray-600">
              Page {history?.currentPage || page} of {history?.totalPages || 1}
            </span>

            <button
              disabled={page >= (history?.totalPages || 1)}
              onClick={() => handlePageChange(page + 1)}
              className="px-4 py-2 text-xs sm:text-sm bg-white shadow rounded-xl disabled:opacity-40"
            >
              Next
            </button>

          </div>
        )}

      </div>
    </div>
  );
}