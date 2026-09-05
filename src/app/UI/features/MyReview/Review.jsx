"use client";

import { useMemo, useState } from "react";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

import { Search, Star, MessageSquare, Send, CalendarDays } from "lucide-react";

const GET_ASTROLOGER_REVIEWS = gql`
  query GetAstrologerReviews($page: Int!, $limit: Int!, $rating: Int) {
    getAstrologerReviews(
      filter: { page: $page, limit: $limit, rating: $rating }
    ) {
      success
      totalCount
      currentPage
      totalPages
      limit

      data {
        userName
        id
        sessionId
        sessionType
        sessionStatus
        rating
        comment
        reply
        isFlagged
        createdAt
      }
    }
  }
`;

const REPLY_TO_REVIEW = gql`
  mutation ReplyToReview($reviewId: String!, $reply: String!) {
    replyToReview(reviewId: $reviewId, reply: $reply) {
      success
      message
    }
  }
`;

export default function AstrologerReviews() {
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const limit = 10;
  const rating = 3; // optional filter

  const [replyInputs, setReplyInputs] = useState({});

  // GET REVIEWS
  const { data, loading, refetch } = useQuery(GET_ASTROLOGER_REVIEWS, {
    variables: {
      page,
      limit,
      rating,
    },
    fetchPolicy: "network-only",
  });

  // REPLY MUTATION
  const [replyToReview, { loading: replying }] = useMutation(REPLY_TO_REVIEW);

  const reviewsData = data?.getAstrologerReviews;

  const reviews = reviewsData?.data || [];

  // SEARCH FILTER
  const filteredReviews = useMemo(() => {
    if (!reviews.length) return [];

    return reviews.filter((item) => {
      const searchValue = search.toLowerCase();

      return (
        item?.sessionType?.toLowerCase()?.includes(searchValue) ||
        item?.sessionStatus?.toLowerCase()?.includes(searchValue) ||
        item?.comment?.toLowerCase()?.includes(searchValue)
      );
    });
  }, [reviews, search]);

  // HANDLE REPLY
  const handleReply = async (reviewId) => {
    try {
      const reply = replyInputs[reviewId];

      if (!reply?.trim()) return;

      await replyToReview({
        variables: {
          reviewId,
          reply,
        },
      });

      await refetch();

      setReplyInputs((prev) => ({
        ...prev,
        [reviewId]: "",
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // RENDER STARS
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#f7f3fb] p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4b1d74]">
            My Reviews
          </h1>

          <p className="text-gray-500 ">Customer feedback & ratingss</p>
        </div>

        <div className="relative w-full md:w-[350px]">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />

          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-purple-200 rounded-full pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
        <div className="bg-purple-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Reviews</p>

            <MessageSquare className="w-5 h-5 text-purple-500" />
          </div>

          <h2 className="text-2xl font-bold text-[#4b1d74] mt-2">
            {reviewsData?.totalCount || 0}
          </h2>
        </div>

        {/* AVG RATING */}
        <div className="bg-purple-300 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Average Rating</p>

            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>

          <h2 className="text-2xl font-bold text-[#4b1d74] mt-2">
            {filteredReviews.length > 0
              ? (
                  filteredReviews.reduce((acc, item) => acc + item.rating, 0) /
                  filteredReviews.length
                ).toFixed(1)
              : "0"}
          </h2>
        </div>

        <div className="bg-violet-200 rounded-2xl border border-gray-300  shadow-2xl px-5 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Current Page</p>

            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>

          <h2 className="text-2xl font-bold text-[#4b1d74] mt-2">
            {reviewsData?.currentPage || 1}
          </h2>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Loading reviews...
        </div>
      ) : (
        <>
          {/* CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition p-5"
                >
                  {/* TOP */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#4b1d74] text-sm">
                        {review.sessionType}
                      </h3>
                           <p className="text-[10px] font-semibold text-gray-500 mt-1">
                       {review.userName}
                      </p>

                      <p className="text-[10px] text-gray-500 mt-1">
                        ID: {review.sessionId.slice(0, 8)}
                      </p>

                      <p className="text-[10px] flex  text-gray-500">
                        Status: {review.sessionStatus}
                      </p>

                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* STARS */}
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* COMMENT */}
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-gray-700 mb-2">
                      Comment
                    </p>

                    <div className="bg-gray-50 border overflow-y-scroll border-gray-100 shadow-xl rounded-xl p-2 text-gray-700 text-[10px] min-h-17">
                      {review.comment}
                    </div>
                  </div>

                  {/* REPLY */}
                  {review.reply ? (
                    <div className="mt-2">
                      <p className="text-[10px]  text-[#4b1d74] mb-2">
                        Your Reply
                      </p>

                      <div className="bg-purple-50 border  border-purple-100 rounded-xl p-2 text-[10px] text-gray-700">
                        {review.reply}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-[10px] font- text-[#4b1d74] mb-1">
                        Reply
                      </p>

                      <div className="flex border border-purple-100 rounded-xl p-2 outline-none focus:ring-1">
                        <textarea
                          rows={3}
                          placeholder="Write your reply..."
                          value={replyInputs[review.id] || ""}
                          onChange={(e) =>
                            setReplyInputs((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          className="w-full  focus:ring-purple-500 text-[10px] placeholder:text-[10px] resize-none"
                        />

                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={replying}
                          className="mt-2 flex items-center gap-2 bg-[#6d35a3] hover:bg-[#572987] text-white px-3 py-1 rounded-xl text-xs transition"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-500">
                No reviews found
              </div>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-10 bg-white border border-purple-100 rounded-2xl p-4">
            <p className="text-sm text-gray-500">
              Page {reviewsData?.currentPage || 1} of{" "}
              {reviewsData?.totalPages || 1}
            </p>

            <div className="flex items-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="px-4 py-2 border rounded-xl disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>

              <button
                disabled={page >= (reviewsData?.totalPages || 1)}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-4 py-2 bg-[#6d35a3] text-white rounded-xl hover:bg-[#572987] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
