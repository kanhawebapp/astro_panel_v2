"use client";
import styles from "@/app/UI/features/ChatHistoryCard/chatHistory.module.css";
import { FadeLoader } from "react-spinners";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BasicPagination from "../../PaginationUI/Pagination";
import { useGetExpertCallHistoryQuery } from "@/app/redux/slice/callHistorySlice";
import useFilteredSearch from "@/hooks/useFilteredSearch";
import { useSuggestRemedyMutation } from "@/app/redux/slice/chatHi2";
import {
  Edit,
  NotebookPen,
  MessageSquare,
  FileText,
  Activity,
  Eye,
  BookOpen,
  PhoneCall,
  Filter,
  Search,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";


const CallHistoryCard = () => {
  const [suggestRemedy] = useSuggestRemedyMutation();
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const router = useRouter();

  const { data, error, isLoading, isFetching } = useGetExpertCallHistoryQuery({
    page,
    per_page: perPage,
  });

  const filteredData = useFilteredSearch(data?.data, [
    "client_name",
    "call_session_id",
    "user_id",
  ]);

  const pagination = data?.pagination || {};
  const handleClick = (orderId) => {
    router.push(`/dashboard/callhistory/callNotes/${orderId}`);
  };
  const getKundli = (orderId) => {
    router.push(`/dashboard/callhistory/kundli/${orderId}`);
  };

  const buttonClass =
    filteredData.call_status === "ANSWERED"
      ? "flex items-center justify-center gap-1 flex-1 py-1.5 px-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 transition"
      : "flex items-center justify-center  gap-1 flex-1 py-1.5 px-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 transition";

  const [showModal, setShowModal] = useState(false);
  const [remedyText, setRemedyText] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredAlertIndex, setHoveredAlertIndex] = useState(null);

  const handleSubmitRemedy = async () => {
    if (!remedyText.trim()) return alert("Please enter remedy");

    setSubmitting(true);
    try {
      const response = await suggestRemedy({
        Suggrem: remedyText,
        request_session_id: selectedOrderId,
      }).unwrap();

      alert("Remedy submitted successfully");
      setShowModal(false);
      setRemedyText("");
    } catch (error) {
      // console.error("Submission error:", error);
      alert(error?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  if (error) {
    return (
      <p>
        Error fetching call history:{" "}
        {error?.data?.message || "Something went wrong"}
      </p>
    );
  }

  if (isLoading)
    return (
      <div className="h-screen flex flex-col justify-center items-center">
        <FadeLoader color="#2f1254" height={17} width={5} />
        <div className="mt-2">Loading call history...</div>
      </div>
    );

  return (
    <div
      className={`${styles.callingHis} flex flex-wrap items-center w-[100%] justify-self-center flex-col  gap-4`}
    >
      <h2 className="wallet-head text-center">Call History</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6  md:w-full">
        {filteredData.map((card, index) => (
          <div
            key={index}
            className="relative max-w-sm w-full bg-white border border-purple-100 rounded-2xl shadow-lg  hover:shadow-xl transition duration-300 space-y-4 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-50 via-purple-100/30 to-white p-2 md:p-4">
              <div
                className={
                  card.is_promotional === 0
                    ? "absolute top-2 right-4 flex gap-2"
                    : "absolute top-0 right-0 flex gap-0"
                }
              >
                <div className="relative group flex items-center justify-between gap-1 md:gap-2">
                  <span
                    className="relative inline-block"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-purple-600" />
                    <div
                     className={`absolute top-2 right-[-5px] z-10 w-40 bg-white border border-gray-200 rounded-md shadow-md p-3 text-xs text-gray-700 transition-all duration-300 ${
                        hoveredIndex === index ? "opacity-100 visible" : "opacity-0 invisible"
                      }`}
                    >
                      <p>
                        <span className="font-semibold text-purple-700">
                          Gender:
                        </span>{" "}
                        {card.form_meta.gender || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-purple-700">
                          DOB:
                        </span>{" "}
                        {card.form_meta.bidate || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-purple-700">
                          POB:
                        </span>{" "}
                        {card.form_meta.birth_place || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-purple-700">
                          TOB:
                        </span>{" "}
                        {card.form_meta.btime || "N/A"}
                      </p>
                    </div>
                  </span>

                    <div
                    onMouseEnter={() => setHoveredAlertIndex(index)}
                    onMouseLeave={() => setHoveredAlertIndex(null)}
                    className="relative"
                  >
                    {card.refund_reason !== "" && (
                      <div className="flex items-center justify-between ">
                        <TriangleAlert className="w-4 h-4 text-red-600 cursor-pointer hover:text-purple-600" />
                        <div
                          className={`absolute top-6 right-[-5px] z-10 w-40 bg-white border border-gray-200 rounded-md shadow-md p-3 text-xs text-gray-700 transition-all duration-300 ${
                            hoveredAlertIndex === index ? "opacity-100 visible" : "opacity-0 invisible"
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-purple-700">Refund Reasone</div><span>{card.refund_reason}</span> 
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    onClick={() => handleClick(card.call_session_id)}
                    className="flex items-center justify-between"
                  >
                    <NotebookPen className="w-4 h-4 text-gray-400 cursor-pointer hover:text-purple-600" />
                  </div>
                </div>
                {card.is_promotional != 0 && (
                  <div className="w-[2.5rem] md:w-auto">
                    {/* Use next/image for images in Next.js, not the global Image constructor */}
                   <Image
                      src="/prblm/new.png"
                      alt="New"
                      width={50}
                      height={50}
                      // style={{ display: "block" }}
                    />
                  </div>
                )}
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="font-semibold text-purple-700">
                    Order ID :
                  </span>{" "}
                  <span className="font-mono text-gray-800">
                    {card.call_session_id || card.request_session_id}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-purple-700">Name :</span>{" "}
                  <span className="text-gray-800">
                    {card.client_name} ({card.user_id})
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-purple-700">Date :</span>{" "}
                  <span className="text-gray-700">
                    {" "}
                    {card.call_start_time
                      ? new Date(
                        card.call_start_time.replace(" ", "T")
                      ).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                      : "N/A"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-purple-700">
                    Earning :
                  </span>{" "}
                  <span className="text-gray-700">₹ {card.earning || "0"}</span>
                </p>
              </div>
              {/* <hr className="border-t border-gray-200" /> */}
              <p>
                <span className="font-semibold text-purple-700">Rate :</span>{" "}
                <span className="text-gray-700">
                  ₹ {card.expert_charges || "0"} / min
                </span>{" "}
              </p>
              <p>
                <span className="font-semibold text-purple-700">
                  Duration :
                </span>
                <span className="text-gray-700">
                  {" "}
                  {card.call_duration_used || "N/A"}
                </span>
              </p>

              {/* Status */}
              <div className="text-sm  grid grid-cols-2  text-gray-800">
                <div className="flex items-center text-sm text-yellow-500 mt-1">
                  <span className="font-semibold text-purple-700 mr-2">
                    Rating:
                  </span>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 fill-current ${i < card.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.286 3.966c.3.922-.755 1.688-1.538 1.118l-3.388-2.46a1 1 0 00-1.176 0l-3.388 2.46c-.783.57-1.838-.196-1.538-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z" />
                    </svg>
                  ))}
                </div>
                <p className="place-self-end text-sm text-gray-700 mt-1">
                  <span className="font-semibold text-purple-700">
                    Status :
                  </span>{" "}
                  <span
                    className={
                      card.call_status === "AGENT_NO_ANSWER" || card.call_status === "CUSTOMER_NO_ANSWER"
                        ? "text-red-600 font-medium"
                        : "text-green-600 font-medium"
                    }
                  >
                     {card.call_status === "AGENT_NO_ANSWER" || card.call_status === "CUSTOMER_NO_ANSWER"
                      ? "NO ANSWER"
                      : card.call_status || "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Review Section */}
            < div className="bg-purple-50 border border-purple-200 rounded-md p-3 mt-2 text-sm text-gray-700 m-5" >
              <span className="font-semibold text-purple-700">Review:</span>{" "}
              {data.review || "No review available."}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:justify-between m-5">
              {card.call_status === "ANSWERED" && (
                <button
                  onClick={() => {
                    setSelectedOrderId(card.request_session_id);
                    setShowModal(true);
                  }}
                  className=" flex items-center justify-center gap-1 flex-1 py-1.5 px-2 text-xs font-medium border border-purple-500 text-purple-700 rounded-md hover:bg-purple-50 transition 
                   "
                >
                  <Activity className="w-4 h-4" />
                  Suggest Remedy
                </button>
              )}
              <button
                className={buttonClass}
                onClick={() => getKundli(card.call_session_id)}
              >
                <FileText className="w-4 h-4" />
                Open Kundli
              </button>
            </div>
          </div>
        ))
        }
      </div >
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0000009a] bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md">
            <div className="text-[1rem] justify-self-center font-semibold mb-2">
              Suggest Remedy for Order ID: {selectedOrderId}
            </div>
            <textarea
              disabled={submitting}
              className="w-full border p-2 rounded mb-4"
              rows={4}
              placeholder="Enter remedy..."
              value={remedyText}
              onChange={(e) => setRemedyText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setRemedyText("");
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRemedy}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BasicPagination
        currentPage={page}
        totalPages={pagination?.last_page || 1}
        onPageChange={(newPage) => setPage(newPage)}
        siblingCount={1}
        boundaryCount={1}
        showInfo={true}
        isLoading={isFetching}
      />
      {
        isFetching && (
          <div className="mt-2 text-sm text-gray-500">Loading Page...</div>
        )
      }
    </div >
  );
};

export default CallHistoryCard;
