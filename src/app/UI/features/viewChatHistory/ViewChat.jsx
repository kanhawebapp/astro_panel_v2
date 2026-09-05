"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGetChatBySessionIdQuery } from "@/app/redux/slice/chatHistoryApi";
import { useGetExpertProfileDetailsQuery } from "@/app/redux/slice/profileApi";

const PROFILE_IMG_BASE = "https://webdemonew.dhwaniastro.co.in/public/cms-images/user-images/";
const CHAT_IMG_BASE = "https://socketbackend-hja7.onrender.com/uploads/";

const ViewChat = ({ order_id, user_id }) => {
  const searchParams = useSearchParams();
  const [zoomImg, setZoomImg] = useState(null);
  const session_id = order_id || searchParams.get("session_id");
  const endRef = useRef(null);

  const { data, isLoading, isFetching, error } = useGetChatBySessionIdQuery(session_id, { skip: !session_id });
  const { data: expertData } = useGetExpertProfileDetailsQuery();
  const profileData = expertData?.profileData || {};
  const expertImageUrl = profileData?.image_path && profileData?.image
    ? `https://webdemonew.dhwaniastro.co.in/${profileData.image_path}${profileData.image}`
    : "/Dhwani-logo.jpg";

  const messages = data?.recordList || data?.messages || [];

 
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading || isFetching) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error loading chat data</div>;
  if (!messages.length) return <div>No chat messages found.</div>;

  const fromData = data?.fromData || {};

  return (
    <div className="flex flex-col h-[80vh] bg-gradient-to-br from-[#f3e8ff] via-[#e0e7ff] to-[#f0fdfa] rounded-3xl overflow-hidden shadow-2xl w-full border border-purple-100 backdrop-blur-md">
      {/* Header */}
      <div className="top-0 z-10 bg-gradient-to-r from-purple-700/90 via-purple-400/80 to-blue-400/80 shadow-xl p-6 flex items-center gap-4 border-b w-full backdrop-blur-md">
        <div className="flex flex-col text-white">
          <span className="font-bold text-lg tracking-wide drop-shadow-lg">{fromData?.name || "User"}</span>
          <span className="text-xs uppercase tracking-widest opacity-90 font-semibold">{fromData?.request_type}</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-2 sm:p-6 flex-1 space-y-6 w-full overflow-y-auto bg-gradient-to-br from-white/60 via-purple-50/60 to-blue-50/60">
        {/* User Info Card as first message */}
        <div className="flex justify-start w-full">
          <div className="flex items-end gap-2 max-w-[85vw] sm:max-w-[75%]">
            <div className="p-4 ml-4 rounded-3xl shadow-xl bg-gradient-to-br from-white/90 via-purple-50/80 to-blue-50/80 text-gray-900 border border-purple-100 break-words min-w-[60px] backdrop-blur-md">
              <div className="flex flex-col gap-1 text-xs">
                <span><b>👤 Name:</b> {fromData.name}</span>
                <span><b>⚧ Gender:</b> {fromData.gender}</span>
                <span><b>🎂 DOB:</b> {fromData.dob}</span>
                <span><b>⏰ TOB:</b> {fromData.btime}</span>
                <span><b>📍 Place:</b> {fromData.birth_place}</span>
                <span><b>💼 Occupation:</b> {fromData.occupation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        {messages.map((msg) => {
          const isCustomer = msg.user_id === Number(user_id);
          const alignClass = isCustomer ? "justify-start" : "justify-end";
          const bubbleColor = isCustomer
            ? "bg-white text-gray-900 border border-gray-200"
            : "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white";
          const timeAlign = isCustomer ? "text-left text-gray-500" : "text-right text-white";
          const userImgUrl = msg.user?.profile_image
            ? `${PROFILE_IMG_BASE}${msg.user.profile_image}`
            : "/Dhwani-logo.jpg";
          const imgSrc = isCustomer ? userImgUrl : expertImageUrl;
          return (
            <div key={msg.id} className={`flex ${alignClass} w-full`}>
              <div className={`flex items-end gap-2 max-w-[85vw] sm:max-w-[75%] ${isCustomer ? "" : "flex-row-reverse"}`}>
                <img
                  src={imgSrc}
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-400 shadow-lg ring-2 ring-white"
                  style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #f0fdfa 100%)' }}
                  onError={e => { e.target.onerror = null; e.target.src = '/Dhwani-logo.jpg'; }}
                />
                <div
                  className={`relative p-4 rounded-3xl shadow-xl ${bubbleColor} break-words group transition-all duration-200 hover:shadow-2xl border border-purple-100/60 backdrop-blur-md`}
                  style={{ minWidth: "60px", background: isCustomer ? 'rgba(255,255,255,0.95)' : 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)', position: 'relative' }}
                >
                  {/* Bubble pointer */}
                  <span
                    className={`absolute top-4 ${isCustomer ? '-left-3' : '-right-3'} w-0 h-0 border-t-8 border-b-8 ${isCustomer ? 'border-r-8 border-r-white border-t-transparent border-b-transparent' : 'border-l-8 border-l-purple-400 border-t-transparent border-b-transparent'}`}
                    style={{ filter: isCustomer ? 'drop-shadow(0 0 2px #e5e7eb)' : 'drop-shadow(0 0 2px #a78bfa)' }}
                  />
                  {/* Reply block if present */}
                  {msg.replyTo && (
                    <div className={`mb-2 p-2 rounded-2xl bg-gradient-to-r from-purple-50/80 to-blue-50/80 border-l-4 ${isCustomer ? 'border-purple-400' : 'border-yellow-400'} shadow-md`} style={{ fontSize: '13px', boxShadow: '0 2px 8px 0 #ede9fe' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-purple-700 text-xs bg-purple-100 px-2 py-0.5 rounded">↩️ Reply</span>
                        <span className="text-gray-500 text-xs">{msg.replyTo.sender}</span>
                      </div>
                      <div className="text-gray-800 italic">{msg.replyTo.message}</div>
                      {msg.replyTo.image && (
                        <img
                          src={`${msg.replyTo.image}`}
                          alt="reply-img"
                          className="h-16 rounded-xl mt-1 border border-purple-100 shadow-md"
                          style={{ width: 'auto', height: '4rem', objectFit: 'contain', background: '#f3e8ff' }}
                          onError={e => { e.target.onerror = null; e.target.src = '/Dhwani-logo.jpg'; }}
                        />
                      )}
                    </div>
                  )}
                  {msg.image ? (
                    <img
                      src={`${CHAT_IMG_BASE}${msg.image}`}
                      alt="chat-img"
                      className="h-[6rem] rounded-2xl cursor-zoom-in border border-purple-100 shadow-md hover:scale-105 transition-transform duration-200"
                      style={{ width: 'auto', height: '6rem', objectFit: 'cover', background: '#ede9fe' }}
                      onClick={() => setZoomImg(`${CHAT_IMG_BASE}${msg.image}`)}
                      onError={e => { e.target.onerror = null; e.target.src = '/Dhwani-logo.jpg'; }}
                    />
                  ) : (
                    <p className="whitespace-pre-line text-base leading-relaxed text-gray-900" style={{ wordBreak: 'break-word' }}>{msg.message}</p>
                  )}
                  <div className={`text-[10px] mt-1 ${timeAlign}`}>{msg.created_time}</div>
                </div>
                {zoomImg && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000001c] bg-opacity-70"
                    onClick={() => setZoomImg(null)}
                  >
                    <div className="relative">
                      <img
                        src={zoomImg}
                        alt="Zoomed chat"
                        className="max-w-[90vw] max-h-[76vh] rounded-lg  border-4 border-white"
                        style={{ width: 'auto', height: 'auto', objectFit: 'contain' }}
                        onClick={e => e.stopPropagation()}
                        onError={e => { e.target.onerror = null; e.target.src = '/Dhwani-logo.jpg'; }}
                      />
                      <button
                        className="absolute flex items-center justify-center h-[2rem] w-[2rem] top-2 right-2 text-white bg-[#2f1254] rounded-full p-2 shadow"
                        onClick={() => setZoomImg(null)}
                        aria-label="Close"
                      >
                        <span className="text-2xl font-bold">&times;</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef}></div>
        <div className="flex justify-center w-full mt-2">
          <div className="bg-gradient-to-r from-pink-200 via-red-100 to-yellow-100 text-red-700 text-center rounded-full py-2 px-8 text-lg font-extrabold border-t-2 border-red-300 shadow-2xl animate-fadeIn drop-shadow-lg">
            <span className="tracking-wide flex items-center gap-2">
              <svg className="w-6 h-6 text-red-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 20v1M12 4V3m0 0a9 9 0 11-6.219 15.219" /></svg>
              Chat Ended
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewChat;
