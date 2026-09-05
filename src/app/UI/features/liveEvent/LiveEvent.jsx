"use client";

import { useState } from "react";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client/react";

import AgoraChat from "agora-chat";
console.log(
  "AGORA CHAT APP KEY:",
  process.env.NEXT_PUBLIC_AGORA_CHAT_APPKEY
);

const chatClient = new AgoraChat.connection({
  appKey: process.env.NEXT_PUBLIC_AGORA_CHAT_APPKEY,
});

import {
  START_LIVE,
  END_LIVE,
  JOIN_LIVE,
  SCHEDULE_LIVE,
  GET_MY_SCHEDULED_LIVES,
} from "@/app/utils/panelQueries";

import AgoraRTC from "agora-rtc-sdk-ng";

const client = AgoraRTC.createClient({
  mode: "live",
  codec: "vp8",
});

export default function AgentLiveStreaming() {
  const [title, setTitle] = useState("");
  const [streamId, setStreamId] = useState(null);

  const [isLive, setIsLive] = useState(false);

  const [micTrack, setMicTrack] = useState(null);
  const [cameraTrack, setCameraTrack] = useState(null);

  const [scheduleTitle, setScheduleTitle] = useState("");

  const [scheduleDate, setScheduleDate] = useState("");

  const [scheduleTime, setScheduleTime] = useState("");
  const [messages, setMessages] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);

  const { data, refetch } = useQuery(GET_MY_SCHEDULED_LIVES, {
    fetchPolicy: "network-only",
  });

  const scheduledLives = data?.getMyScheduledLives || [];

  const [startLive] = useMutation(START_LIVE);

  const [endLive] = useMutation(END_LIVE);

  // FIXED: joinLive is Query, not Mutation
  const [joinLive] = useLazyQuery(JOIN_LIVE);

  const [scheduleLive, { loading: scheduling }] = useMutation(SCHEDULE_LIVE);

  const handleStartLive = async () => {
    try {
      if (!title.trim()) {
        alert("Enter stream title");
        return;
      }

      const { data: startData } = await startLive({
        variables: {
          title,
        },
      });

      const stream = startData?.startLive;

      if (!stream) {
        throw new Error("Unable to start live");
      }

      setStreamId(stream.id);

      const { data: joinData } = await joinLive({
        variables: {
          channelName: stream.channelName,
          role: "publisher",
        },
      });

      const live = joinData?.joinLive;

      if (!live) {
        throw new Error("Unable to join live");
      }

      await client.setClientRole("host");

      await client.join(live.appId, live.channelName, live.rtcToken, live.uid);

      // login chat

      await chatClient.open({
        user: `astro_${live.uid}`,
        accessToken: live.chatToken,
      });

      // join chat room

      await chatClient.joinChatRoom({
        roomId: live.chatRoomId,
      });

      chatClient.addEventHandler("LIVE_CHAT", {
        onTextMessage: (message) => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: message.from,
              text: message.msg,
            },
          ]);
        },
      });
      const mic = await AgoraRTC.createMicrophoneAudioTrack();

      const camera = await AgoraRTC.createCameraVideoTrack();

      await client.publish([mic, camera]);

      camera.play("local-player");

      setMicTrack(mic);
      setCameraTrack(camera);

      setIsLive(true);

      alert("Live started successfully");
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          error?.graphQLErrors?.[0]?.message ||
          "Failed to start live",
      );
    }
  };

  const handleEndLive = async () => {
    try {
      if (cameraTrack) {
        cameraTrack.stop();
        cameraTrack.close();
      }

      if (micTrack) {
        micTrack.stop();
        micTrack.close();
      }
      
      await chatClient.close();
      await client.leave();

      if (streamId) {
        await endLive({
          variables: {
            streamId,
          },
        });
      }

      setCameraTrack(null);
      setMicTrack(null);

      setIsLive(false);
      setStreamId(null);

      alert("Live ended successfully");
    } catch (error) {
      console.error(error);

      alert(error?.message || "Failed to end live");
    }
  };

  const handleSchedule = async () => {
    try {
      if (!scheduleTitle || !scheduleDate || !scheduleTime) {
        alert("Fill all fields");
        return;
      }

      const scheduledAt = new Date(
        `${scheduleDate}T${scheduleTime}`,
      ).toISOString();

      await scheduleLive({
        variables: {
          title: scheduleTitle,
          scheduledAt,
        },
      });

      await refetch();

      setScheduleTitle("");
      setScheduleDate("");
      setScheduleTime("");

      alert("Live scheduled successfully");
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          error?.graphQLErrors?.[0]?.message ||
          "Failed to schedule live",
      );
    }
  };

 return (
  <div className="p-6">
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* ================= LIVE VIDEO ================= */}

      <div className="xl:col-span-2 bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Live Streaming
          </h2>

          {isLive ? (
            <span className="px-4 py-2 rounded-full bg-red-500 text-white animate-pulse">
              LIVE
            </span>
          ) : (
            <span className="px-4 py-2 rounded-full bg-gray-200">
              OFFLINE
            </span>
          )}
        </div>

        <input
          className="w-full border rounded-lg p-3 mb-4"
          placeholder="Enter Live Title"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <div
          id="local-player"
          className="w-full h-[500px] rounded-xl overflow-hidden bg-black"
        />

        <div className="flex gap-4 mt-5">
          {!isLive ? (
            <button
              onClick={handleStartLive}
              className="bg-red-600 text-white px-6 py-3 rounded-lg"
            >
              Start Live Now
            </button>
          ) : (
            <button
              onClick={handleEndLive}
              className="bg-black text-white px-6 py-3 rounded-lg"
            >
              End Live
            </button>
          )}
        </div>
      </div>

      {/* ================= LIVE CHAT ================= */}

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
                className="mb-3 border-b pb-2"
              >
                <p className="font-semibold text-blue-600">
                  {msg.sender}
                </p>

                <p className="text-gray-700">
                  {msg.text}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {msg.time}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}

      <div className="space-y-6">

        {/* Schedule */}

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-xl font-bold mb-4">
            Schedule Live
          </h3>

          <input
            value={scheduleTitle}
            onChange={(e) =>
              setScheduleTitle(e.target.value)
            }
            placeholder="Live Title"
            className="w-full border rounded-lg p-3 mb-3"
          />

          <input
            type="date"
            value={scheduleDate}
            onChange={(e) =>
              setScheduleDate(e.target.value)
            }
            className="w-full border rounded-lg p-3 mb-3"
          />

          <input
            type="time"
            value={scheduleTime}
            onChange={(e) =>
              setScheduleTime(e.target.value)
            }
            className="w-full border rounded-lg p-3 mb-4"
          />

          <button
            disabled={scheduling}
            onClick={handleSchedule}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {scheduling
              ? "Scheduling..."
              : "Schedule Live"}
          </button>
        </div>

        {/* Upcoming */}

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-xl font-bold mb-4">
            Upcoming Lives
          </h3>

          {scheduledLives.length === 0 ? (
            <p>No scheduled lives</p>
          ) : (
            scheduledLives.map((live) => (
              <div
                key={live.id}
                className="border rounded-lg p-3 mb-3"
              >
                <h4 className="font-semibold">
                  {live.title}
                </h4>

                <p>
                  📅{" "}
                  {new Date(
                    live.scheduledAt
                  ).toLocaleDateString("en-IN")}
                </p>

                <p>
                  ⏰{" "}
                  {new Date(
                    live.scheduledAt
                  ).toLocaleTimeString("en-IN")}
                </p>

                <p className="text-sm text-blue-600 mt-1">
                  {live.status}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Statistics */}

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
                {isLive
                  ? "LIVE"
                  : "OFFLINE"}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
