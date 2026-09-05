"use client";

import { useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Search,
  MessageCircle,
  Clock3,
  CalendarDays,
  Star,
  Eye,
  FileText,
  Activity,
  Filter,
} from "lucide-react";
import SessionMessagesModal from "./sessionmodal";
import {
  GET_ASTROLOGER_CHAT_HISTORY,
  GET_REMEDIES,
  SEND_REMEDY,
} from "@/app/utils/panelQueries";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function AstrologerChatHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remedyText, setRemedyText] = useState("");

  const [selectedRemedy, setSelectedRemedy] = useState(null);

  const { data: remediesData, loading: remediesLoading } =
    useQuery(GET_REMEDIES);

  const [sendRemedyMutation] = useMutation(SEND_REMEDY);

  const [page, setPage] = useState(1);

  const limit = 12;
  const router = useRouter();

  const getKundli = (roomId) => {
    console.log("roomId in getKundli functionxxxxxxxxxxxxxxxxxxxxxx", roomId);
    router.push(`/dashboard/chathistory/kundli/${roomId}`);
  };

  const { data, loading, error } = useQuery(GET_ASTROLOGER_CHAT_HISTORY, {
    variables: {
      page,
      limit,
      status: statusFilter === "ALL" ? null : statusFilter,

      source: sourceFilter !== "ALL" ? sourceFilter : undefined,
    },
    fetchPolicy: "network-only",
  });

  const chatHistory = data?.getAstrologerChatHistory;

  const filteredChats = useMemo(() => {
    if (!chatHistory?.data) return [];

    return chatHistory.data.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        item?.userName?.toLowerCase().includes(searchValue) ||
        item?.sessionId?.toLowerCase().includes(searchValue) ||
        item?.birthPlace?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" || item?.status === statusFilter;

      const matchesSource =
        sourceFilter === "ALL" || item?.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [chatHistory, search, statusFilter, sourceFilter]);

  if (error) {
    return <div className="p-6 text-red-500">Error loading chat history</div>;
  }

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

  const renderStars = (rating = 0) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        }
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#f7f3fb] p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Chat History
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Chats</p>

            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {chatHistory?.totalCount || 0}
          </h2>
        </div>

        <div className="bg-violet-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Current Page</p>

            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {chatHistory?.currentPage || 1}
          </h2>
        </div>

        <div className="bg-purple-300 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Pages</p>

            <Clock3 className="w-5 h-5 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold mt-2 text-gray-800">
            {chatHistory?.totalPages || 1}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-full border-gray-300  shadow-2xl  p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search by user, mobile, room ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300  shadow-2xl  rounded-full pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 border text-xs  shadow-2xl  rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-black min-w-[140px]"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ONGOING">ONGOING</option>
            <option value="MISSED">MISSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* ✅ SOURCE FILTER */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border-gray-300 border text-xs  rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-black min-w-[140px]"
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
          <div className="col-span-full text-center py-8">
            Loading chat history...
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat.sessionId}
              className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs">
                      <span className="font-semibold text-purple-700">
                        Session ID :
                      </span>{" "}
                      <span className="text-gray-600 font-semibold">
                        {chat.sessionId?.slice(0, 8)}
                      </span>
                    </p>

                    <p className="mt-1 text-xs">
                      <span className="font-bold text-purple-700">Name :</span>{" "}
                      <span className="text-gray-700">{chat.userName}</span>
                    </p>

                    {/* ✅ Display Source */}
                    <p className="mt-1 text-xs">
                      <span className="font-bold text-purple-700">
                        Source :
                      </span>{" "}
                      <span className="text-gray-700">
                        {chat.source || chat.intakeSource || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Date :</span>{" "}
                  {new Date(chat.createdAt).toLocaleString()}
                </p>

                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">
                    Birth Place :
                  </span>{" "}
                  {chat.birthPlace || "-"}
                </p>
                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Rate :</span> ₹{" "}
                  {chat.ratePerMin}/min
                </p>
                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Earning :</span> ₹{" "}
                  {chat.commission}
                </p>

                <p className="text-xs mb-1">
                  <span className="font-bold text-purple-700">Duration :</span>{" "}
                  {chat.durationMinutes < 60
                    ? `${chat.durationMinutes} sec`
                    : `${Math.floor(chat.durationMinutes / 60)} min${
                        chat.durationMinutes % 60
                          ? ` ${chat.durationMinutes % 60} sec`
                          : ""
                      }`}
                </p>

                <div className="flex text-xs justify-between items-center mt-3">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-purple-700">Rating:</span>

                    {renderStars(chat.rating)}
                  </div>

                  <span
                    className={`font-semibold ${
                      chat.status === "COMPLETED"
                        ? "text-green-500"
                        : "text-orange-500"
                    }`}
                  >
                    {chat.status}
                  </span>
                </div>

                {/* REVIEW */}
                <div className="mt-5 text-xs bg-purple-50 border border-purple-100 rounded-xl px-4 py-2  min-h-[90px]">
                  <p className="font-bold text-purple-700 mb-2">Review :</p>

                  <p className="text-xs text-gray-600">
                    {chat.reviewComment || "No review available."}
                  </p>
                </div>

                {/* BUTTONS */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {chat.status === "COMPLETED" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedOrderId(chat.sessionId);
                          setShowModal(true);
                        }}
                        className="flex items-center text-xs justify-center gap-1 flex-1 py-1.5 px-2 text-xs font-medium border border-purple-500 text-purple-700  rounded-xl hover:bg-purple-50 transition"
                      >
                        <Activity className="w-4 h-4" />
                        Remedy
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSession(chat.sessionId);
                          setOpenModal(true);
                        }}
                        className="border text-xs border-blue-400 text-blue-500 rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-blue-50"
                      >
                        <Eye size={16} />
                        Chat
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => getKundli(chat.roomId)}
                    className="bg-purple-600 text-white rounded-xl py-2 text-xs flex items-center justify-center gap-2 hover:bg-purple-700"
                  >
                    <FileText size={16} />
                    Kundli
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500">
            No chat history found
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-550 bg-[#0000009a] bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md max-h-[80vh] overflow-y-auto">
            <div className="text-sm justify-self-center  mb-3">
              Order ID:
              {selectedOrderId}
            </div>

            <div className="mb-4">
              <h4 className="text-xs mb-2">Select Existing Remedy</h4>

              {remediesLoading ? (
                <p>Loading remedies...</p>
              ) : (
                <div className="max-h-50 overflow-y-auto border border-gray-300 shadow-xl rounded-xl">
                  {remediesData?.getRemedies?.data
                    ?.filter((item) => item.isActive)
                    ?.map((remedy) => (
                      <div
                        key={remedy.id}
                        onClick={() => {
                          setSelectedRemedy(remedy);
                          setRemedyText(remedy.description);
                        }}
                        className={`p-2 border-b cursor-pointer hover:bg-gray-100 ${
                          selectedRemedy?.id === remedy.id
                            ? "bg-indigo-100"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {remedy.title}
                        </div>

                        <div className="text-xs text-gray-600">
                          {remedy.description?.replace(/<[^>]*>/g, "")}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className=" block mb-2 text-xs ">
                Or Write New Remedy
              </label>

              <textarea
                disabled={submitting}
                className="w-full border border-gray-300 p-2 rounded-xl shadow-xl"
                rows={3}
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
                className="bg-gray-300 px-4 py-1 text-xs rounded-full"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitRemedy}
                disabled={submitting}
                className="bg-indigo-600 text-white px-4 py-1 text-xs rounded-full"
              >
                {submitting ? "Submitting..." : "Send Remedy"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SessionMessagesModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        sessionId={selectedSession}
      />

      <div className="flex items-center justify-between mt-8">
        <p className="text-sm text-gray-500">
          Page {chatHistory?.currentPage || 1} of {chatHistory?.totalPages || 1}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-4 py-2 border rounded-xl disabled:opacity-50"
          >
            Previous
          </button>

          <button
            disabled={page === chatHistory?.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 border rounded-xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
