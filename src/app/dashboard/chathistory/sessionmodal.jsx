"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

import { X, Image as ImageIcon, Loader2 } from "lucide-react";

const GET_SESSION_MESSAGES = gql`
  query GetSessionMessages($sessionId: String!) {
    getSessionMessages(sessionId: $sessionId) {
      success
      totalCount

      data {
        id
        sender
        message
        image
        time
        createdAt
      }
    }
  }
`;

export default function SessionMessagesModal({ open, onClose, sessionId }) {
  // API CALL
  const { data, loading, error } = useQuery(GET_SESSION_MESSAGES, {
    variables: {
      sessionId,
    },

    skip: !sessionId || !open,

    fetchPolicy: "network-only",
  });

  const messages = data?.getSessionMessages?.data || [];

  // CLOSE IF NOT OPEN
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-500 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Chat History</h2>

            <p className="text-sm text-gray-500 mt-1">
              Session ID: {sessionId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="h-[550px] overflow-y-auto bg-gray-50 p-5">
          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              Loading messages...
            </div>
          ) : error ? (
            /* ERROR */
            <div className="flex items-center justify-center h-full text-red-500">
              Error loading messages
            </div>
          ) : messages.length > 0 ? (
            /* MESSAGES */
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "Astrologer"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-[#FFF4B8] text-gray-900"
                        : "bg-[#EED6FF] text-gray-900"
                    }`}
                  >
                    {/* SENDER */}
                    <div className="text-xs font-semibold opacity-70 mb-1">
                      {msg.sender}
                    </div>

                    {/* MESSAGE */}
                    {msg.message && (
                      <p className="text-sm break-words">{msg.message}</p>
                    )}

                    {/* IMAGE */}
                    {msg.image && (
                      <div className="mt-3">
                        <img
                          src={msg.image}
                          alt="chat"
                          className="w-52 rounded-xl border"
                        />

                        <div className="flex items-center gap-1 text-xs opacity-70 mt-2">
                          <ImageIcon className="w-3 h-3" />
                          Image
                        </div>
                      </div>
                    )}

                    {/* TIME */}
                    <div className="text-[11px] opacity-60 mt-2">
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY */
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
