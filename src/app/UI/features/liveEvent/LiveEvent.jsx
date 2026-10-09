
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client/react";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraChat from "agora-chat";

import {
  START_LIVE,
  END_LIVE,
  JOIN_LIVE,
  SCHEDULE_LIVE,
  GET_MY_SCHEDULED_LIVES,
} from "@/app/utils/panelQueries";

export default function AgentLiveStreaming() {
  const [title, setTitle] = useState("");
  const [streamId, setStreamId] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);

  const [liveInfo, setLiveInfo] = useState(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const rtcClientRef = useRef(null);
  const chatClientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const chatHandlerRegisteredRef = useRef(false);
  const messagesSeenRef = useRef(new Set());

  const [startLive] = useMutation(START_LIVE);
  const [endLive] = useMutation(END_LIVE);
  const [joinLive] = useLazyQuery(JOIN_LIVE);
  const [scheduleLive, { loading: scheduling }] =
    useMutation(SCHEDULE_LIVE);

  const { data, refetch } = useQuery(GET_MY_SCHEDULED_LIVES, {
    fetchPolicy: "network-only",
  });

  const scheduledLives = data?.getMyScheduledLives || [];

  // Connect to Agora Chat and join the stream's room.
  const connectChat = useCallback(async (live) => {
    if (!live.chatRoomId) {
      throw new Error("Chat room ID is missing");
    }

    if (!live.chatUsername || !live.chatToken) {
      throw new Error(
        "Missing authenticated Agora Chat username or token. " +
          "Return these fields from your backend joinLive query."
      );
    }

    const appKey = process.env.NEXT_PUBLIC_AGORA_CHAT_APPKEY;

    if (!appKey) {
      throw new Error("Agora Chat App Key is not configured");
    }

    const chatClient = new AgoraChat.connection({ appKey });
    chatClientRef.current = chatClient;

    await chatClient.open({
      user: live.chatUsername,
      accessToken: live.chatToken,
    });

    await chatClient.joinChatRoom({
      roomId: live.chatRoomId,
    });

    chatClient.addEventHandler("agent-live-chat-handler", {
      onTextMessage: (msg) => {
        if (msg.chatType !== "chatRoom") return;
        if (String(msg.to) !== String(live.chatRoomId)) return;

        // Avoid adding the same message twice.
        if (messagesSeenRef.current.has(msg.id)) return;
        messagesSeenRef.current.add(msg.id);

        let payload = null;

        try {
          payload = JSON.parse(msg.msg);
        } catch {
          // Regular messages are displayed as text.
        }

        const isGiftPayload = payload?.type === "gift";

        // Only accept gift notifications from the trusted server identity.
        // Configure this value to match the identity used by your backend
        // when it publishes gift notifications.
        const trustedNotifier =
          live.giftNotifierUsername ||
          process.env.NEXT_PUBLIC_AGORA_GIFT_NOTIFIER_USERNAME;

        const isTrustedGift =
          isGiftPayload &&
          trustedNotifier &&
          String(msg.from).toLowerCase() ===
            String(trustedNotifier).toLowerCase();

        const newMessage = isTrustedGift
          ? {
              id: msg.id,
              type: "gift",
              sender: payload.senderName || "Viewer",
              text: `sent ${payload.quantity} x ${payload.giftName}`,
              time: new Date().toLocaleTimeString(),
            }
          : {
              id: msg.id,
              type: "text",
              sender: msg.from || "Viewer",
              text: msg.msg,
              time: new Date().toLocaleTimeString(),
            };

        setMessages((previous) => [...previous, newMessage]);
      },
    });

    chatHandlerRegisteredRef.current = true;
  }, []);

  const handleStartLive = async () => {
    if (starting) return;

    let rtcClient;

    try {
      if (!title.trim()) {
        alert("Enter stream title");
        return;
      }

      setStarting(true);
      setMessages([]);
      messagesSeenRef.current.clear();
      setViewerCount(0);

      // 1. Create or activate the stream.
      const { data: startData } = await startLive({
        variables: { title: title.trim() },
      });

      const stream = startData?.startLive;

      if (!stream?.id || !stream?.channelName) {
        throw new Error("Unable to create live stream");
      }

      setStreamId(stream.id);

      // 2. Request authenticated publisher credentials.
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
        throw new Error("Missing Agora RTC publisher credentials");
      }

      if (!live.chatRoomId) {
        throw new Error("Chat room is missing for this stream");
      }

      const currentLive = {
        ...live,
        id: stream.id,
        title: stream.title || title.trim(),
      };

      setLiveInfo(currentLive);

      // 3. Join the RTC channel.
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

      // 4. Connect to the chat room and listen for gift notifications.
      await connectChat(currentLive);

      // 5. Start local audio/video.
      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = mic;

      const camera = await AgoraRTC.createCameraVideoTrack();
      cameraTrackRef.current = camera;

      await rtcClient.publish([mic, camera]);
      camera.play("local-player");

      setIsLive(true);
      alert("Live started successfully");
    } catch (error) {
      console.error("Start live error:", error);

      try {
        cameraTrackRef.current?.close();
        micTrackRef.current?.close();

        cameraTrackRef.current = null;
        micTrackRef.current = null;

        const chatClient = chatClientRef.current;

        if (chatClient) {
          if (liveInfo?.chatRoomId) {
            try {
              await chatClient.leaveChatRoom({
                roomId: liveInfo.chatRoomId,
              });
            } catch {}
          }

          await chatClient.close();
          chatClientRef.current = null;
        }

        if (rtcClient) {
          await rtcClient.leave();
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
          "Failed to start live"
      );
    } finally {
      setStarting(false);
    }
  };

  // Send ordinary astrologer chat messages.
  const sendAstrologerMessage = async () => {
    const text = message.trim();
    const chatClient = chatClientRef.current;

    if (!text) return;

    if (!chatClient || !liveInfo?.chatRoomId) {
      alert("Chat is not connected");
      return;
    }

    try {
      const outgoing = AgoraChat.message.create({
        chatType: "chatRoom",
        type: "txt",
        to: liveInfo.chatRoomId,
        msg: text,
      });

      await chatClient.send(outgoing);
      setMessage("");
    } catch (error) {
      console.error("Send message error:", error);
      alert("Unable to send message");
    }
  };

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
              roomId: liveInfo.chatRoomId,
            });
          } catch (error) {
            console.warn("Leave chat room warning:", error);
          }
        }

        await chatClient.close();
      }

      if (streamId) {
        await endLive({
          variables: { streamId },
        });
      }

      setIsLive(false);
      setStreamId(null);
      setLiveInfo(null);
      setViewerCount(0);
      setMessages([]);

      rtcClientRef.current = null;
      chatClientRef.current = null;
      chatHandlerRegisteredRef.current = false;
      messagesSeenRef.current.clear();

      alert("Live ended successfully");
    } catch (error) {
      console.error("End live error:", error);
      alert(error?.message || "Failed to end live");
    } finally {
      setEnding(false);
    }
  };

  const handleSchedule = async () => {
    try {
      if (!scheduleTitle.trim() || !scheduleDate || !scheduleTime) {
        alert("Fill all scheduling fields");
        return;
      }

      const scheduledAt = new Date(
        `${scheduleDate}T${scheduleTime}`
      ).toISOString();

      await scheduleLive({
        variables: {
          title: scheduleTitle.trim(),
          scheduledAt,
        },
      });

      await refetch();

      setScheduleTitle("");
      setScheduleDate("");
      setScheduleTime("");

      alert("Live scheduled successfully");
    } catch (error) {
      console.error("Schedule live error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to schedule live"
      );
    }
  };

  // Release resources if the component unmounts.
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

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* LIVE VIDEO */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Live Streaming</h2>

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
                onClick={handleStartLive}
                disabled={starting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                {starting ? "Starting..." : "Start Live Now"}
              </button>
            ) : (
              <button
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
          <h3 className="text-xl font-bold mb-4">Live Chat</h3>

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
                    {msg.sender}
                  </p>

                  {msg.type === "gift" ? (
                    <p className="font-semibold text-orange-600">
                      🎁 {msg.text}
                    </p>
                  ) : (
                    <p className="text-gray-700">{msg.text}</p>
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
          {/* SCHEDULE LIVE */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-4">Schedule Live</h3>

            <input
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              placeholder="Live Title"
              className="w-full border rounded-lg p-3 mb-3"
            />

            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full border rounded-lg p-3 mb-3"
            />

            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full border rounded-lg p-3 mb-4"
            />

            <button
              disabled={scheduling}
              onClick={handleSchedule}
              className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {scheduling ? "Scheduling..." : "Schedule Live"}
            </button>
          </div>

          {/* UPCOMING LIVES */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-4">Upcoming Lives</h3>

            {scheduledLives.length === 0 ? (
              <p>No scheduled lives</p>
            ) : (
              scheduledLives.map((live) => (
                <div
                  key={live.id}
                  className="border rounded-lg p-3 mb-3"
                >
                  <h4 className="font-semibold">{live.title}</h4>

                  <p>
                    📅{" "}
                    {new Date(live.scheduledAt).toLocaleDateString("en-IN")}
                  </p>

                  <p>
                    ⏰{" "}
                    {new Date(live.scheduledAt).toLocaleTimeString("en-IN")}
                  </p>

                  <p className="text-sm text-blue-600 mt-1">
                    {live.status}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* STATISTICS */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-4">Statistics</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-100 p-3 rounded-lg">
                <p>Total Viewers</p>
                <h2 className="text-2xl font-bold">{viewerCount}</h2>
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
    </div>
  );
}