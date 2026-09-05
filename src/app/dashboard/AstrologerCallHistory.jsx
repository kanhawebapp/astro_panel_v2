"use client";

import { useMemo, useState } from "react";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

import {
  Search,
  Phone,
  Clock3,
  Coins,
  CalendarDays,
  IndianRupee,
  BadgeCheck,
  Globe,
  Activity,
} from "lucide-react";
import {
  GET_ASTROLOGER_CALL_HISTORY,
  GET_REMEDIES,
  SEND_REMEDY,
} from "@/app/utils/panelQueries";

export default function AstrologerCallHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remedyText, setRemedyText] = useState("");
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const { data: remediesData, loading: remediesLoading } =
    useQuery(GET_REMEDIES);

  const [sendRemedyMutation] = useMutation(SEND_REMEDY);
  const handleSubmitRemedy = async () => {
    const finalRemedy = remedyText?.trim() || selectedRemedy?.description;

    if (!finalRemedy) {
      toast.error("Please enter or select a remedy");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await sendRemedyMutation({
        variables: {
          sessionId: selectedOrderId,
          remedyText: finalRemedy,
        },
      });

      if (data?.sendRemedy?.success) {
        toast.success(data.sendRemedy.message);

        setShowModal(false);
        setRemedyText("");
        setSelectedRemedy(null);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const limit = 10;

  // APOLLO QUERY - Updated with source filter
  const { data, loading, error } = useQuery(GET_ASTROLOGER_CALL_HISTORY, {
    variables: {
      page,
      limit,
      status: statusFilter === "ALL" ? null : statusFilter,
    },
    fetchPolicy: "network-only",
  });

  const callHistory = data?.getAstrologerCallHistory;

  // SEARCH + FILTER
  const filteredCalls = useMemo(() => {
    if (!callHistory?.data) return [];

    return callHistory.data.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        item?.userName?.toLowerCase().includes(searchValue) ||
        item?.sessionId?.toLowerCase().includes(searchValue) ||
        item?.roomId?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" || item?.status === statusFilter;

      const matchesSource =
        sourceFilter === "ALL" || item?.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [callHistory, search, statusFilter, sourceFilter]);

  if (error) {
    return <div className="p-6 text-red-500">Error loading call history</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f3fb] p-4 md:p-6">
      <div className="mb-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Call History
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Calls</p>
            <Phone className="w-5 h-5 text-blue-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {callHistory?.totalCount || 0}
          </h2>
        </div>

        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Current Page</p>
            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {callHistory?.currentPage || 1}
          </h2>
        </div>

        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Amount Earned</p>
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {filteredCalls.reduce(
              (acc, item) => acc + (item.coinsEarned || 0),
              0,
            )}
          </h2>
        </div>
      </div>

      <div className="bg-white  rounded-full border-gray-300 border shadow-sm p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search by user name, session ID, room ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border  rounded-full border-gray-300  pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border  rounded-full border-gray-300 px-4 py-2.5 outline-none focus:ring-1 focus:ring-black min-w-[160px]"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ONGOING">Ongoing</option>
          </select>

          {/* SOURCE FILTER */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="border  rounded-full border-gray-300 px-4 py-2.5 outline-none focus:ring-1 focus:ring-black min-w-[140px]"
          >
            <option value="ALL">All Sources</option>
            <option value="WEB">Web</option>
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
            {/* Add more source options as needed */}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">
            Loading call history...
          </div>
        ) : filteredCalls.length > 0 ? (
          filteredCalls.map((call) => (
            <div
              key={call.sessionId}
              className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs">
                      <span className="font-semibold text-purple-700">
                        Session :
                      </span>{" "}
                      <span className="text-gray-700 font-semibold">
                        {call.sessionId.slice(0, 8)}
                      </span>
                    </p>

                    <p className="mt-1 text-xs">
                      <span className="font-bold text-purple-700">User :</span>{" "}
                      {call.userName}
                    </p>

                    <p className="mt-1 text-xs">
                      <span className="font-bold text-purple-700">
                        Source :
                      </span>{" "}
                      {call.source || "N/A"}
                    </p>
                  </div>

                  <Phone className="text-purple-500" size={20} />
                </div>

                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Date :</span>{" "}
                  {new Date(call.createdAt).toLocaleString()}
                </p>

                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Duration :</span>{" "}
                  {call.durationMinutes < 60
                    ? `${call.durationMinutes} sec`
                    : `${Math.floor(call.durationMinutes / 60)} min${
                        call.durationMinutes % 60
                          ? ` ${call.durationMinutes % 60} sec`
                          : ""
                      }`}
                </p>

                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Rate :</span> ₹{" "}
                  {call.ratePerMin}/min
                </p>

                <div className="flex text-xs justify-between items-center mt-3">
                  <p className="text-xs mb-1">
                    <span className="font-bold text-purple-700">Earning :</span>{" "}
                    ₹ {call.commission}
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      call.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : call.status === "ONGOING"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {call.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {/* <button
              onClick={() => handleDownloadRecording(call.sessionId)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Download Recording
            </button> */}
                  <button
                    onClick={() => {
                      setSelectedOrderId(call.sessionId);
                      setShowModal(true);
                    }}
                    className="flex items-center text-xs justify-center gap-1 flex-1 py-1.5 px-2 text-xs font-medium border border-purple-500 text-purple-700  rounded-xl hover:bg-purple-50 transition"
                  >
                    <Activity size={16} />
                    Remedy
                  </button>
                </div>
                {showModal && (
                  <div className="fixed inset-0 z-50 bg-[#0000009a] bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md max-h-[80vh] overflow-y-auto">
                      <div className="text-[1rem] justify-self-center font-semibold mb-4">
                        Suggest Remedy for Order ID:
                        {selectedOrderId}
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">
                          Select Existing Remedy
                        </h4>

                        {remediesLoading ? (
                          <p>Loading remedies...</p>
                        ) : (
                          <div className="max-h-[200px] overflow-y-auto border rounded">
                            {remediesData?.getRemedies?.data
                              ?.filter((item) => item.isActive)
                              ?.map((remedy) => (
                                <div
                                  key={remedy.id}
                                  onClick={() => {
                                    setSelectedRemedy(remedy);
                                    setRemedyText(remedy.description);
                                  }}
                                  className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                                    selectedRemedy?.id === remedy.id
                                      ? "bg-indigo-100"
                                      : ""
                                  }`}
                                >
                                  <div className="font-medium">
                                    {remedy.title}
                                  </div>

                                  <div className="text-sm text-gray-600">
                                    {remedy.description}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="font-medium block mb-2">
                          Or Write New Remedy
                        </label>

                        <textarea
                          disabled={submitting}
                          className="w-full border p-2 rounded"
                          rows={4}
                          placeholder="Enter remedy..."
                          value={remedyText}
                          onChange={(e) => setRemedyText(e.target.value)}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowModal(false);
                            setRemedyText("");
                            setSelectedRemedy(null);
                          }}
                          className="bg-gray-300 px-4 py-2 rounded"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={handleSubmitRemedy}
                          disabled={submitting}
                          className="bg-indigo-600 text-white px-4 py-2 rounded"
                        >
                          {submitting ? "Submitting..." : "Send Remedy"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            No call history found
          </div>
        )}
      </div>
      {/* PAGINATION */}
{callHistory?.totalPages > 1 && (
  <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
    {/* Previous */}
    <button
      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
      disabled={page === 1 || loading}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
        page === 1 || loading
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
      }`}
    >
      Previous
    </button>

    {/* Page Numbers */}
    {Array.from(
      { length: callHistory.totalPages },
      (_, index) => index + 1
    ).map((pageNumber) => (
      <button
        key={pageNumber}
        onClick={() => setPage(pageNumber)}
        disabled={loading}
        className={`w-10 h-10 rounded-lg border text-sm font-medium transition ${
          page === pageNumber
            ? "bg-purple-600 text-white border-purple-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-purple-50"
        }`}
      >
        {pageNumber}
      </button>
    ))}

    {/* Next */}
    <button
      onClick={() =>
        setPage((prev) =>
          Math.min(prev + 1, callHistory.totalPages)
        )
      }
      disabled={page === callHistory.totalPages || loading}
      className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
        page === callHistory.totalPages || loading
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
      }`}
    >
      Next
    </button>
  </div>
)}
    </div>
  );
}
