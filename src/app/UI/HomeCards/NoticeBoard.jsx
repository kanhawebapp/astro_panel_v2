"use client";

import { GetAstrologerNotices } from "@/app/utils/panelQueries";
import { useQuery } from "@apollo/client/react";

export default function NoticeBoardPage() {
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const { data, loading, error } = useQuery(
    GetAstrologerNotices,
    {
      fetchPolicy: "network-only",
    }
  );

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading notices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load notices.
      </div>
    );
  }


  const allNotices =
    data?.getAstrologerNotices || [];

  const todayNotices = allNotices.filter(
    (notice) => isToday(notice.createdAt)
  );

  const olderNotices = allNotices.filter(
    (notice) => !isToday(notice.createdAt)
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        📢 Notice Board
      </h1>

      {/* Today's Notices */}

      {todayNotices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            Today's Noticessssssssssssss
          </h2>

          {todayNotices.map((notice) => (
            <div
              key={notice.id}
              className={`mb-4 p-5 rounded-xl shadow border ${
                notice.isPinned
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {notice.isPinned && (
                      <span>📌</span>
                    )}
                    {notice.title}
                  </h3>
                </div>

                <p className="text-sm text-gray-500 whitespace-nowrap">
                  {formatDateTime(
                    notice.createdAt
                  )}
                </p>
              </div>

              <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                {notice.description}
              </p>

              {notice.startDate && (
                <div className="mt-3 text-xs text-gray-500">
                  Active From:{" "}
                  {formatDateTime(
                    notice.startDate
                  )}
                </div>
              )}

              {notice.endDate && (
                <div className="text-xs text-gray-500">
                  Active Until:{" "}
                  {formatDateTime(
                    notice.endDate
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Previous Notices */}

      {olderNotices.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Previous Notices
          </h2>

          {olderNotices.map((notice) => (
            <div
              key={notice.id}
              className={`mb-4 p-5 rounded-xl shadow-sm ${
                notice.isPinned
                  ? "bg-yellow-50 border border-yellow-300"
                  : "bg-white border"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {notice.isPinned && (
                    <span>📌</span>
                  )}
                  {notice.title}
                </h3>

                <p className="text-sm text-gray-500 whitespace-nowrap">
                  {/* {formatDateTime(
                    notice.createdAt
                  )} */}
                </p>
              </div>

              <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                {notice.description}
              </p>

              {notice.startDate && (
                <div className="mt-3 text-xs text-gray-500">
                  Active From:{" "}
                  {formatDateTime(
                    notice.startDate
                  )}
                </div>
              )}

              {notice.endDate && (
                <div className="text-xs text-gray-500">
                  Active Until:{" "}
                  {/* {formatDateTime(
                    notice.endDate
                  )} */}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {todayNotices.length === 0 &&
        olderNotices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No notices available.
          </div>
        )}
    </div>
  );
}