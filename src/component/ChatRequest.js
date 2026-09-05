"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useContext, useRef } from "react";
import SocketContext from "./SocketClient";
import { useRouter } from "next/navigation";
import PopUp from "@/app/common/PopUp";
import { encryptParams } from "@/app/utils/crypto";
import { getCoordinates } from "../../utils/getCordinates";

const ChatRequest = () => {
  const router = useRouter();
  const audioRef = useRef(null);
  const stopRingtone = () => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };
  const handleEnableRingtone = async () => {
    try {
      const audio = audioRef.current;

      if (!audio) return;

      // Browser ko user gesture ke through audio unlock karna
      audio.currentTime = 0;
      await audio.play();

      // Abhi koi request nahi hai, isliye ringtone immediately stop
      audio.pause();
      audio.currentTime = 0;

      setUserInteracted(true);
      localStorage.setItem("userInteracted", "true");

      console.log("🔊 Ringtone enabled successfully");
    } catch (error) {
      console.error("❌ Failed to enable ringtone:", error);
    }
  };

  const socket = useContext(SocketContext);
  const [chatRequests, setChatRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [acceptchat, setAcceptChat] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [message, setMessage] = useState("");
  const [reject, setReject] = useState(false);
  const [autoReject, setAutoReject] = useState(false);
  const currentRequestRef = useRef(null);
  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedValue = localStorage.getItem("userInteracted");

    if (storedValue === "true") {
      setUserInteracted(true);
      return;
    }

    const handleUserClick = () => {
      setUserInteracted(true);
      localStorage.setItem("userInteracted", "true");
      window.removeEventListener("click", handleUserClick);
    };

    window.addEventListener("click", handleUserClick);

    return () => {
      window.removeEventListener("click", handleUserClick);
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      console.log("Socket not connected");
      return;
    }
    //const astroId = localStorage.getItem("USER");//astro_user
    const astroId = JSON.parse(localStorage.getItem("astro_user"))?.id;
    console.log("Listening for chat requests for astroId:", astroId);
socket.on("new_chat_request", (data) => {
  if (data.astro_id == astroId) {
    console.log("📞 New chat request:", data);

    currentRequestRef.current = data;

    setCurrentRequest(data);
    setIsModalOpen(true);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;

      audioRef.current
        .play()
        .then(() => {
          console.log("🔊 CHAT RINGTONE STARTED");
        })
        .catch((err) => {
          console.error("❌ CHAT RINGTONE FAILED:", err);
        });
    }
  }
});
 socket.on("chat_started_astrologer", async (data) => {
  const request = currentRequestRef.current;

  if (!request) {
    console.error("❌ No current chat request found");
    return;
  }

  if (data.roomid !== request.room_id) {
    return;
  }

  try {
    const coords = await getCoordinates(request.location);

    const chatParams = {
      userName: request.userName,
      roomId: request.room_id,
      chattime: request.maximum_time?.toString(),
      userId: request.user_id,
      place: request.location,
      time: request.timeOfBirth?.toString(),
      bod: request.dateOfBirth,

      lat: coords?.lat,
      lon: coords?.lon,

      gender: request.gender,
      occupationuser: request.occupation,
      userimage: request.user_image || "",
    };

    const encrypted = encryptParams(chatParams);

    console.log("🚀 Navigating to astrologer chat:", chatParams);

    stopRingtone();

    router.push(`/astrologerchat?data=${encrypted}`);
  } catch (error) {
    console.error("❌ Failed to start chat:", error);
  }
});

    socket.on("chat_rejected_astrologer", async (data) => {
      if (data.roomid === currentRequestRef.current?.room_id) {
        stopRingtone();
        setAcceptChat(false);
        setReject(true);

        setTimeout(() => {
          setReject(false);
        }, 3000);
      }
    });

    socket.on("chat_cancel_by_user", async (data) => {
      stopRingtone();
      // if (data.roomid === currentRequest.room_id) {
      setIsModalOpen(false);
      setAcceptChat(false);

      // }
    });

    socket.on("chat_cancel_by_admin", async (data) => {
      stopRingtone();
      // if (data.roomid === currentRequest.room_id) {
      setIsModalOpen(false);
      setAcceptChat(false);

      // }
    });

    socket.on("chat_reject_auto", async (data) => {
      if (data.roomId === currentRequestRef.current?.room_id) {
        stopRingtone();
        setIsModalOpen(false);
        setAutoReject(true);
        setAcceptChat(false);
        setMessage("The User has rejected the chat request");
        setTimeout(() => {
          setAutoReject(false);
        }, 3000);
      }
    });

    socket.on("chat_transfer", async (data) => {
      if (data.transfer_from == astroId) {
        localStorage.setItem("transfer_from", astroId);
        localStorage.setItem("ischatTransfer", true);
        setIsModalOpen(false);
      }
    });
    return () => {
      stopRingtone();
      socket.off("new_chat_request");
      socket.off("chat_started_astrologer");
      socket.off("chat_reject_auto");
      socket.off("chat_rejected_astrologer");
      socket.off("chat_transfer");
      socket.off("chat_cancel_by_user");
      socket.off("chat_cancel_by_admin");
    };
  }, [socket]);

  // const handleAccept = () => {
  //   const { room_id } = currentRequest;

  //   socket.emit("chat_accepted_astrologer", {"room_id": room_id ,"astroId": astroId, "userId":userId}, (response) => {});

  //   setIsModalOpen(false);
  //   setAcceptChat(true);
  // };

const handleAccept = () => {
  const request = currentRequestRef.current;

  if (!request) {
    console.error("No current chat request found");
    return;
  }

  const roomId = request.room_id;

  const astroUser = JSON.parse(
    localStorage.getItem("astro_user") || "{}"
  );

  const astroId = astroUser?.id;
  const userId = request.user_id;

  if (!roomId || !astroId || !userId) {
    console.error("Missing chat accept data:", {
      roomId,
      astroId,
      userId,
      request,
    });
    return;
  }

  console.log("Accepting chat:", {
    room_id: roomId,
    astroId,
    userId,
  });

  stopRingtone();

  socket.emit(
    "chat_accepted_astrologer",
    {
      room_id: roomId,
      astroId,
      userId,
    },
    (response) => {
      console.log(
        "chat_accepted_astrologer response:",
        response
      );
    }
  );

  setIsModalOpen(false);
  setAcceptChat(true);
};

  const handleReject = () => {
    const request = currentRequestRef.current;

    if (!request) return;

    const { room_id, astro_id } = request;
    stopRingtone();
    socket.emit(
      "chat_rejected_astrologer",
      { room_id, astro_id },
      (response) => {},
    );
    setIsModalOpen(false);
    setAcceptChat(false);
  };

  return (
    <>
      <div>
        <audio ref={audioRef} src="/sounds/sound2.mp3" preload="auto" loop />

        {!userInteracted && (
          <PopUp
            title="Enable Ringtone Notifications "
            buttontype={1}
            buttonname="Enable Notifications"
            onClick={handleEnableRingtone}
          />
        )}

        {reject && (
          <PopUp
            title="Chat Rejected"
            subtitle="Chat rejected by User"
            buttontype={0}
          />
        )}

        {autoReject && (
          <PopUp title="Chat Rejected" subtitle={message} buttontype={0} />
        )}
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-[99999] bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal box */}

            {currentRequest && (
              <motion.div
                className="fixed z-[100000] w-full max-w-sm p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg top-1/2 left-1/2 rounded-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h2 className="mb-3 text-xl font-bold">
                  Incoming Chat Request
                </h2>
                <p className="mb-3 text-sm text-gray-600">
                  Do you want to accept this chat?
                </p>
                <p className="text-sm text-gray-800">
                  Name: {currentRequest.userName}
                </p>
                <p className="mb-6 text-sm text-gray-600">
                  Chat Id: {currentRequest.room_id}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 text-red-700 bg-red-100 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {acceptchat && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed z-50 w-full max-w-sm p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg top-1/2 left-1/2 rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="mb-3 text-xl font-bold">Chat : Please Wait ...</h2>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatRequest;
