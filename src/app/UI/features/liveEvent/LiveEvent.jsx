"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useMutation,
  useQuery,
  useLazyQuery,
} from "@apollo/client/react";

import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraChat from "agora-chat";

import {
  START_LIVE,
  END_LIVE,
  JOIN_LIVE,
  SCHEDULE_LIVE,
  GET_MY_SCHEDULED_LIVES,
  UPDATE_SCHEDULED_LIVE,
  DELETE_SCHEDULED_LIVE,
} from "@/app/utils/panelQueries";

export default function AgentLiveStreaming() {
  // ============================================
  // STATE
  // ============================================

  const [title, setTitle] = useState("");

  const [streamId, setStreamId] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [liveInfo, setLiveInfo] = useState(null);

  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  // Schedule live form
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");

  // Edit scheduled live form
  const [editingLiveId, setEditingLiveId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [updatingLive, setUpdatingLive] = useState(false);

  // Delete scheduled live
  const [deletingLiveId, setDeletingLiveId] = useState(null);

  // ============================================
  // REFS
  // ============================================

  const rtcClientRef = useRef(null);
  const chatClientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const messagesSeenRef = useRef(new Set());

  // ============================================
  // GRAPHQL MUTATIONS AND QUERIES
  // ============================================

  const [startLive] = useMutation(START_LIVE);
  const [endLive] = useMutation(END_LIVE);
  const [joinLive] = useLazyQuery(JOIN_LIVE);

  const [scheduleLive, { loading: scheduling }] = useMutation(
    SCHEDULE_LIVE
  );

  const [updateScheduledLive] = useMutation(
    UPDATE_SCHEDULED_LIVE
  );

  const [deleteScheduledLive] = useMutation(
    DELETE_SCHEDULED_LIVE
  );

  const {
    data,
    loading: scheduledLivesLoading,
    refetch,
  } = useQuery(GET_MY_SCHEDULED_LIVES, {
    fetchPolicy: "network-only",
  });

  // ============================================
  // DATE HELPERS
  // ============================================

  // Supports ISO strings, Date values, and Unix timestamps.
  const parseDate = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const date =
      typeof value === "number" ||
      (typeof value === "string" &&
        /^\d+$/.test(value))
        ? new Date(Number(value))
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateForInput = (value) => {
    const date = parseDate(value);

    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (value) => {
    const date = parseDate(value);

    if (!date) return "";

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const formatScheduledDate = (value) => {
    const date = parseDate(value);

    if (!date) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatScheduledTime = (value) => {
    const date = parseDate(value);

    if (!date) return "-";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ============================================
  // SCHEDULED LIVE STREAMS
  // ============================================

  // The backend must also exclude expired sessions.
  // This frontend filter provides an additional safeguard.

  const scheduledLives = (
    data?.getMyScheduledLives || []
  )
    .filter((live) => {
      const endDate = parseDate(live.scheduledEndAt);

      return (
        live.status === "SCHEDULED" &&
        endDate &&
        endDate.getTime() > Date.now()
      );
    })
    .sort((a, b) => {
      const startA = parseDate(a.scheduledAt)?.getTime() ?? 0;
      const startB = parseDate(b.scheduledAt)?.getTime() ?? 0;

      return startA - startB;
    });

  // ============================================
  // OPEN EDIT FORM
  // ============================================

  const handleEditClick = (live) => {
    if (live.status !== "SCHEDULED") {
      alert("Only scheduled lives can be edited.");
      return;
    }

    const scheduledDate = parseDate(live.scheduledAt);
    const scheduledEndDate = parseDate(live.scheduledEndAt);

    if (!scheduledDate || !scheduledEndDate) {
      alert(
        "This session has an invalid or missing schedule."
      );
      return;
    }

    if (scheduledEndDate.getTime() <= Date.now()) {
      alert("This scheduled live has already expired.");
      return;
    }

    setEditingLiveId(live.id);
    setEditTitle(live.title || "");
    setEditDate(formatDateForInput(live.scheduledAt));
    setEditTime(formatTimeForInput(live.scheduledAt));
    setEditEndTime(formatTimeForInput(live.scheduledEndAt));
  };

  // ============================================
  // CANCEL EDIT
  // ============================================

  const handleCancelEdit = () => {
    if (updatingLive) return;

    setEditingLiveId(null);
    setEditTitle("");
    setEditDate("");
    setEditTime("");
    setEditEndTime("");
  };

  // ============================================
  // SAVE EDITED SCHEDULED LIVE
  // ============================================

  const handleUpdateScheduledLive = async (e) => {
    e.preventDefault();

    if (!editingLiveId || updatingLive) {
      return;
    }

    if (
      !editTitle.trim() ||
      !editDate ||
      !editTime ||
      !editEndTime
    ) {
      alert(
        "Please fill in the title, date, start time, and end time."
      );
      return;
    }

    // Both times are interpreted in the browser's local timezone.
    const scheduledDateTime = new Date(
      `${editDate}T${editTime}`
    );

    const scheduledEndDateTime = new Date(
      `${editDate}T${editEndTime}`
    );

    if (
      Number.isNaN(scheduledDateTime.getTime()) ||
      Number.isNaN(scheduledEndDateTime.getTime())
    ) {
      alert("Please select a valid date and time.");
      return;
    }

    if (scheduledDateTime.getTime() <= Date.now()) {
      alert("Please select a future start date and time.");
      return;
    }

    if (scheduledEndDateTime <= scheduledDateTime) {
      alert("End time must be later than start time.");
      return;
    }

    try {
      setUpdatingLive(true);

      await updateScheduledLive({
        variables: {
          id: editingLiveId,
          title: editTitle.trim(),
          scheduledAt: scheduledDateTime.toISOString(),
          scheduledEndAt: scheduledEndDateTime.toISOString(),
        },
      });

      await refetch();

      setEditingLiveId(null);
      setEditTitle("");
      setEditDate("");
      setEditTime("");
      setEditEndTime("");

      alert("Scheduled live updated successfully.");
    } catch (error) {
      console.error("Update scheduled live error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to update scheduled live."
      );
    } finally {
      setUpdatingLive(false);
    }
  };

  // ============================================
  // DELETE SCHEDULED LIVE
  // ============================================

  const handleDeleteScheduledLive = async (live) => {
    if (deletingLiveId || updatingLive) {
      return;
    }

    if (live.status !== "SCHEDULED") {
      alert("Only scheduled lives can be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        live.title || "Untitled Live"
      }"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingLiveId(live.id);

      const { data: deleteData } = await deleteScheduledLive({
        variables: {
          id: live.id,
        },
      });

      if (deleteData?.deleteScheduledLive !== true) {
        throw new Error("Unable to delete scheduled live.");
      }

      if (editingLiveId === live.id) {
        setEditingLiveId(null);
        setEditTitle("");
        setEditDate("");
        setEditTime("");
        setEditEndTime("");
      }

      await refetch();

      alert("Scheduled live deleted successfully.");
    } catch (error) {
      console.error("Delete scheduled live error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to delete scheduled live."
      );
    } finally {
      setDeletingLiveId(null);
    }
  };

  // ============================================
  // AGORA CHAT CONNECTION
  // ============================================

  const connectChat = useCallback(async (live) => {
    if (!live?.chatRoomId) {
      throw new Error(
        "Chat room ID is missing from joinLive response."
      );
    }

    if (!live?.chatUserId || !live?.chatToken) {
      throw new Error(
        "Agora Chat credentials are missing from joinLive response."
      );
    }

    const appKey =
      live.chatAppKey ||
      process.env.NEXT_PUBLIC_AGORA_CHAT_APPKEY;

    if (!appKey) {
      throw new Error(
        "Agora Chat App Key is missing. Configure NEXT_PUBLIC_AGORA_CHAT_APPKEY."
      );
    }

    const chatClient = new AgoraChat.connection({
      appKey,
    });

    chatClientRef.current = chatClient;

    chatClient.addEventHandler("agent-live-chat-handler", {
      onTextMessage: (msg) => {
        if (msg.chatType !== "chatRoom") return;

        if (String(msg.to) !== String(live.chatRoomId)) {
          return;
        }

        const messageId =
          msg.id ||
          `${msg.from || "viewer"}-${msg.time || Date.now()}-${msg.msg}`;

        if (messagesSeenRef.current.has(messageId)) {
          return;
        }

        messagesSeenRef.current.add(messageId);

        let payload = null;

        try {
          payload = JSON.parse(msg.msg);
        } catch {
          // Ordinary text message.
        }

        const isGift = payload?.type === "gift";

        const sender =
          (isGift ? payload.senderName : null) ||
          msg.from ||
          "Viewer";

        const text = isGift
          ? `sent ${payload.quantity ?? 1} x ${
              payload.giftName || "gift"
            }`
          : String(msg.msg ?? "");

        setMessages((previous) => [
          ...previous,
          {
            id: messageId,
            type: isGift ? "gift" : "text",
            sender,
            text,
            time: new Date().toLocaleTimeString("en-IN"),
          },
        ]);
      },

      onError: (error) => {
        console.error("Agora Chat event error:", error);
      },
    });

    try {
      await chatClient.open({
        user: live.chatUserId,
        accessToken: live.chatToken,
      });

      await chatClient.joinChatRoom({
        roomId: String(live.chatRoomId),
      });
    } catch (error) {
      try {
        await chatClient.close();
      } catch {}

      if (chatClientRef.current === chatClient) {
        chatClientRef.current = null;
      }

      throw error;
    }
  }, []);

  // ============================================
  // START LIVE
  // ============================================

  const handleStartLive = async () => {
    if (starting) return;

    let rtcClient;
    let currentLive = null;
    let createdStreamId = null;

    try {
      if (!title.trim()) {
        alert("Enter stream title.");
        return;
      }

      setStarting(true);
      setMessages([]);
      messagesSeenRef.current.clear();
      setViewerCount(0);

      // 1. Create or activate the stream.
      const { data: startData } = await startLive({
        variables: {
          title: title.trim(),
        },
      });

      const stream = startData?.startLive;

      if (!stream?.id || !stream?.channelName) {
        throw new Error("Unable to create live stream.");
      }

      createdStreamId = stream.id;
      setStreamId(stream.id);

      // 2. Get publisher credentials.
      const { data: joinData } = await joinLive({
        variables: {
          channelName: stream.channelName,
          role: "publisher",
        },
        fetchPolicy: "no-cache",
      });

      const live = joinData?.joinLive;

      if (
        !live?.appId ||
        !live?.rtcToken ||
        !live?.channelName ||
        live?.uid == null
      ) {
        throw new Error(
          "Missing Agora RTC publisher credentials."
        );
      }

      if (!live.chatRoomId) {
        throw new Error("Chat room is missing for this stream.");
      }

      currentLive = {
        ...live,
        id: stream.id,
        title: stream.title || title.trim(),
      };

      setLiveInfo(currentLive);

      // 3. Join RTC channel.
      rtcClient = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      rtcClientRef.current = rtcClient;

      await rtcClient.setClientRole("host");

      rtcClient.on("user-joined", () => {
        setViewerCount(rtcClient.remoteUsers.length);
      });

      rtcClient.on("user-left", () => {
        setViewerCount(rtcClient.remoteUsers.length);
      });

      await rtcClient.join(
        live.appId,
        live.channelName,
        live.rtcToken,
        live.uid
      );

      // 4. Connect to Agora Chat.
      await connectChat(currentLive);

      // 5. Start microphone and camera.
      const mic = await AgoraRTC.createMicrophoneAudioTrack();

      micTrackRef.current = mic;

      const camera = await AgoraRTC.createCameraVideoTrack();

      cameraTrackRef.current = camera;

      await rtcClient.publish([mic, camera]);

      camera.play("local-player");

      setIsLive(true);

      await refetch();

      alert("Live started successfully.");
    } catch (error) {
      console.error("Start live error:", error);

      try {
        cameraTrackRef.current?.close();
        micTrackRef.current?.close();

        cameraTrackRef.current = null;
        micTrackRef.current = null;

        const chatClient = chatClientRef.current;

        if (chatClient) {
          if (currentLive?.chatRoomId) {
            try {
              await chatClient.leaveChatRoom({
                roomId: String(currentLive.chatRoomId),
              });
            } catch (leaveError) {
              console.warn(
                "Start failure chat-room cleanup:",
                leaveError
              );
            }
          }

          try {
            await chatClient.close();
          } catch (closeError) {
            console.warn(
              "Start failure chat cleanup:",
              closeError
            );
          }

          chatClientRef.current = null;
        }

        if (rtcClient) {
          try {
            await rtcClient.leave();
          } catch (rtcCleanupError) {
            console.warn(
              "Start failure RTC cleanup:",
              rtcCleanupError
            );
          }
        }

        // Reset the stream if setup failed after activation.
        if (createdStreamId) {
          try {
            await endLive({
              variables: {
                streamId: createdStreamId,
              },
            });

            await refetch();
          } catch (endCleanupError) {
            console.warn(
              "Failed to reset stream after start failure:",
              endCleanupError
            );
          }
        }
      } catch (cleanupError) {
        console.error("Start failure cleanup:", cleanupError);
      }

      rtcClientRef.current = null;

      setLiveInfo(null);
      setStreamId(null);
      setIsLive(false);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to start live."
      );
    } finally {
      setStarting(false);
    }
  };

  // ============================================
  // SEND ASTROLOGER MESSAGE
  // ============================================

  const sendAstrologerMessage = async () => {
    const text = message.trim();
    const chatClient = chatClientRef.current;

    if (!text) return;

    if (!isLive || !chatClient || !liveInfo?.chatRoomId) {
      alert("Chat is not connected.");
      return;
    }

    try {
      const outgoing = AgoraChat.message.create({
        chatType: "chatRoom",
        type: "txt",
        to: String(liveInfo.chatRoomId),
        msg: text,
      });

      await chatClient.send(outgoing);

      const sentId =
        outgoing.id ||
        `local-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      messagesSeenRef.current.add(sentId);

      setMessages((previous) => [
        ...previous,
        {
          id: sentId,
          type: "text",
          sender: liveInfo.chatUserId,
          text,
          time: new Date().toLocaleTimeString("en-IN"),
        },
      ]);

      setMessage("");
    } catch (error) {
      console.error("Send message error:", error);

      alert("Unable to send message.");
    }
  };

  // ============================================
  // END LIVE
  // ============================================

  const handleEndLive = async () => {
    if (ending) return;

    setEnding(true);

    try {
      const rtcClient = rtcClientRef.current;
      const chatClient = chatClientRef.current;

      if (cameraTrackRef.current) {
        cameraTrackRef.current.stop();
        cameraTrackRef.current.close();
        cameraTrackRef.current = null;
      }

      if (micTrackRef.current) {
        micTrackRef.current.stop();
        micTrackRef.current.close();
        micTrackRef.current = null;
      }

      if (rtcClient) {
        try {
          await rtcClient.unpublish();
        } catch (error) {
          console.warn("RTC unpublish warning:", error);
        }

        await rtcClient.leave();
      }

      if (chatClient) {
        if (liveInfo?.chatRoomId) {
          try {
            await chatClient.leaveChatRoom({
              roomId: String(liveInfo.chatRoomId),
            });
          } catch (error) {
            console.warn("Leave chat room warning:", error);
          }
        }

        await chatClient.close();
      }

      if (streamId) {
        await endLive({
          variables: {
            streamId,
          },
        });
      }

      setIsLive(false);
      setStreamId(null);
      setLiveInfo(null);
      setViewerCount(0);
      setMessages([]);

      rtcClientRef.current = null;
      chatClientRef.current = null;

      messagesSeenRef.current.clear();

      await refetch();

      alert("Live ended successfully.");
    } catch (error) {
      console.error("End live error:", error);

      alert(error?.message || "Failed to end live.");
    } finally {
      setEnding(false);
    }
  };

  // ============================================
  // SCHEDULE LIVE
  // ============================================

  const handleSchedule = async () => {
    if (scheduling) return;

    try {
      if (
        !scheduleTitle.trim() ||
        !scheduleDate ||
        !scheduleTime ||
        !scheduleEndTime
      ) {
        alert(
          "Please fill in the title, date, start time, and end time."
        );
        return;
      }

      // Use the same date for the start and end times.
      const scheduledDateTime = new Date(
        `${scheduleDate}T${scheduleTime}`
      );

      const scheduledEndDateTime = new Date(
        `${scheduleDate}T${scheduleEndTime}`
      );

      if (
        Number.isNaN(scheduledDateTime.getTime()) ||
        Number.isNaN(scheduledEndDateTime.getTime())
      ) {
        alert("Please select a valid date and time.");
        return;
      }

      if (scheduledDateTime.getTime() <= Date.now()) {
        alert("Please select a future start date and time.");
        return;
      }

      if (scheduledEndDateTime <= scheduledDateTime) {
        alert("End time must be grater than start time.");
        return;
      }

      await scheduleLive({
        variables: {
          title: scheduleTitle.trim(),
          scheduledAt: scheduledDateTime.toISOString(),
          scheduledEndAt: scheduledEndDateTime.toISOString(),
        },
      });

      await refetch();

      setScheduleTitle("");
      setScheduleDate("");
      setScheduleTime("");
      setScheduleEndTime("");

      alert("Live scheduled successfully.");
    } catch (error) {
      console.error("Schedule live error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to schedule live."
      );
    }
  };

  // ============================================
  // COMPONENT CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      const chatClient = chatClientRef.current;
      const rtcClient = rtcClientRef.current;

      cameraTrackRef.current?.stop();
      cameraTrackRef.current?.close();

      micTrackRef.current?.stop();
      micTrackRef.current?.close();

      if (chatClient) {
        chatClient.close().catch((error) => {
          console.warn("Chat cleanup warning:", error);
        });
      }

      if (rtcClient) {
        rtcClient.leave().catch((error) => {
          console.warn("RTC cleanup warning:", error);
        });
      }
    };
  }, []);

  // ============================================
  // UI
  // ============================================

  return (
    <div className="p-6">
      {/* ========================================
          MAIN LIVE STREAMING LAYOUT
      ======================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* LIVE VIDEO */}

        <div className="xl:col-span-2 bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Live Streaming
            </h2>

            <span
              className={`px-4 py-2 rounded-full ${
                isLive
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          <input
            className="w-full border rounded-lg p-3 mb-4"
            placeholder="Enter Live Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div
            id="local-player"
            className="w-full h-[500px] rounded-xl overflow-hidden bg-black"
          />

          <div className="flex gap-4 mt-5">
            {!isLive ? (
              <button
                type="button"
                onClick={handleStartLive}
                disabled={starting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                {starting ? "Starting..." : "Start Live Now"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndLive}
                disabled={ending}
                className="bg-black text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                {ending ? "Ending..." : "End Live"}
              </button>
            )}
          </div>
        </div>

        {/* LIVE CHAT */}

        <div className="bg-white rounded-xl shadow p-4 h-[650px] flex flex-col">
          <h3 className="text-xl font-bold mb-4">
            Live Chat
          </h3>

          <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                No messages yet
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 rounded-lg border-b p-3 ${
                    msg.type === "gift"
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-white"
                  }`}
                >
                  <p className="font-semibold text-blue-600">
                    {msg.sender
                      ?.split("_")[0]
                      ?.replace(/^./, (char) => char.toUpperCase())}
                  </p>

                  {msg.type === "gift" ? (
                    <p className="font-semibold text-orange-600">
                      🎁 {msg.text}
                    </p>
                  ) : (
                    <p className="text-gray-700">
                      {msg.text}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {msg.time}
                  </p>
                </div>
              ))
            )}
          </div>

          {isLive && (
            <form
              className="flex gap-2 mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendAstrologerMessage();
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg p-3"
              />

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 rounded-lg"
              >
                Send
              </button>
            </form>
          )}
        </div>

        {/* RIGHT PANEL */}

        <div className="space-y-6">
          {/* SCHEDULE LIVE FORM */}

          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-4">
              Schedule Live
            </h3>

            <input
              type="text"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              placeholder="Live Title"
              className="w-full border rounded-lg p-3 mb-3"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date
            </label>

            <input
              type="date"
              value={scheduleDate}
              min={formatDateForInput(Date.now())}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full border rounded-lg p-3 mb-3"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>

            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full border rounded-lg p-3 mb-3"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>

            <input
              type="time"
              value={scheduleEndTime}
              onChange={(e) => setScheduleEndTime(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4"
            />

            <button
              type="button"
              disabled={scheduling}
              onClick={handleSchedule}
              className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {scheduling ? "Scheduling..." : "Schedule Live"}
            </button>
          </div>

          {/* STATISTICS */}

          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-4">
              Statistics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-100 p-3 rounded-lg">
                <p>Total Viewers</p>

                <h2 className="text-2xl font-bold">
                  {viewerCount}
                </h2>
              </div>

              <div className="bg-gray-100 p-3 rounded-lg">
                <p>Status</p>

                <h2 className="text-xl font-bold">
                  {isLive ? "LIVE" : "OFFLINE"}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          SCHEDULED LIVE STREAMS TABLE
      ============================================ */}

      <div className="mt-8 bg-white rounded-xl shadow p-6">
        {/* TABLE HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Scheduled Live Streams
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage your upcoming scheduled live sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={scheduledLivesLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {scheduledLivesLoading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {/* EDIT FORM */}

        {editingLiveId && (
          <form
            onSubmit={handleUpdateScheduledLive}
            className="mb-6 border border-blue-200 bg-blue-50 rounded-xl p-5"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Edit Scheduled Live
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live Title
                </label>

                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter live title"
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date
                </label>

                <input
                  type="date"
                  value={editDate}
                  min={formatDateForInput(Date.now())}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>

                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>

                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                type="submit"
                disabled={updatingLive}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {updatingLive ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                disabled={updatingLive}
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* TABLE CONTENT */}

        {scheduledLivesLoading ? (
          <div className="text-center py-10 text-gray-500">
            Loading scheduled live streams...
          </div>
        ) : scheduledLives.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-gray-50">
            <p className="text-gray-600 text-lg">
              No scheduled live streams found.
            </p>

            <p className="text-gray-400 text-sm mt-2">
              Schedule a new live session to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="border px-4 py-3 whitespace-nowrap">
                    #
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap">
                    Live Title
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap">
                    Scheduled Date
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap">
                    Start Time
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap">
                    End Time
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap">
                    Channel Name
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap">
                    Status
                  </th>

                  <th className="border px-4 py-3 whitespace-nowrap text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {scheduledLives.map((live, index) => (
                  <tr
                    key={live.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="border px-4 py-3 text-gray-600">
                      {index + 1}
                    </td>

                    <td className="border px-4 py-3 font-medium text-gray-800">
                      {live.title || "Untitled Live"}
                    </td>

                    <td className="border px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatScheduledDate(live.scheduledAt)}
                    </td>

                    <td className="border px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatScheduledTime(live.scheduledAt)}
                    </td>

                    <td className="border px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatScheduledTime(live.scheduledEndAt)}
                    </td>

                    <td className="border px-4 py-3 text-gray-600">
                      {live.channelName || "-"}
                    </td>

                    <td className="border px-4 py-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {live.status}
                      </span>
                    </td>

                    <td className="border px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(live)}
                          disabled={
                            updatingLive ||
                            deletingLiveId === live.id
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledLive(live)}
                          disabled={
                            deletingLiveId === live.id ||
                            updatingLive
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          {deletingLiveId === live.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TOTAL COUNT */}

        <div className="mt-4 text-sm text-gray-500">
          Total scheduled live streams:{" "}
          <span className="font-semibold text-gray-800">
            {scheduledLives.length}
          </span>
        </div>
      </div>
    </div>
  );
}