"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
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
  START_LIVE_TOGGLE_SERVICES,
  GET_PENDING_LIVE_INTERACTIONS,
  RESPOND_LIVE_INTERACTION_REQUEST,
  END_LIVE_INTERACTION,
} from "@/app/utils/panelQueries";

export default function AgentLiveStreaming({ astrologerId }) {
  // =====================================================
  // STATE
  // =====================================================

  const [title, setTitle] = useState("");
  const [streamId, setStreamId] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [liveInfo, setLiveInfo] = useState(null);

  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [restoringLive, setRestoringLive] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);

  // Schedule live
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");

  // Edit scheduled live
  const [editingLiveId, setEditingLiveId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [updatingLive, setUpdatingLive] = useState(false);

  // Delete scheduled live
  const [deletingLiveId, setDeletingLiveId] = useState(null);

  // Camera and microphone
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraPaused, setIsCameraPaused] = useState(false);

  // Live interaction requests
  const [pendingInteractions, setPendingInteractions] = useState([]);
  const [interactionLoadingId, setInteractionLoadingId] = useState(null);
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [interactionNotice, setInteractionNotice] = useState("");
  const [remoteVideoUid, setRemoteVideoUid] = useState(null);

  // =====================================================
  // REFS
  // =====================================================

  const rtcClientRef = useRef(null);
  const chatClientRef = useRef(null);
  const micTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const messagesSeenRef = useRef(new Set());
  const restoreAttemptRef = useRef(false);
  const restoreTimerRef = useRef(null);
  const remoteVideoTrackRef = useRef(null);
  const remoteAudioTrackRef = useRef(null);
  const activeInteractionRef = useRef(null);

  const apolloClient = useApolloClient();

  // Keep the ref synchronized with state for Agora event callbacks.
  useEffect(() => {
    activeInteractionRef.current = activeInteraction;
  }, [activeInteraction]);

  // =====================================================
  // GRAPHQL
  // =====================================================

  const [startLive] = useMutation(START_LIVE);
  const [endLive] = useMutation(END_LIVE);

  const [scheduleLive, { loading: scheduling }] =
    useMutation(SCHEDULE_LIVE);

  const [updateScheduledLive] = useMutation(UPDATE_SCHEDULED_LIVE);
  const [deleteScheduledLive] = useMutation(DELETE_SCHEDULED_LIVE);
  const [startLiveToggleServices] = useMutation(
    START_LIVE_TOGGLE_SERVICES,
  );

  const [respondLiveInteractionRequest] = useMutation(
    RESPOND_LIVE_INTERACTION_REQUEST,
  );

  const [endLiveInteraction] = useMutation(END_LIVE_INTERACTION);

  const {
    data,
    loading: scheduledLivesLoading,
    refetch,
  } = useQuery(GET_MY_SCHEDULED_LIVES, {
    fetchPolicy: "network-only",
  });

  // Poll for new requests only while the astrologer is live.
  const interactionStreamId = liveInfo?.id || streamId;

  const {
    data: interactionData,
    refetch: refetchInteractions,
  } = useQuery(GET_PENDING_LIVE_INTERACTIONS, {
    variables: {
      liveStreamId: interactionStreamId,
    },
    skip: !isLive || !interactionStreamId,
    fetchPolicy: "network-only",
    pollInterval: isLive && interactionStreamId ? 3000 : 0,
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error("Live interaction polling error:", error);
    },
  });

  // Update incoming request list whenever polling returns new data.
  useEffect(() => {
    const requests =
      interactionData?.getPendingLiveInteractions || [];

    setPendingInteractions(
      requests.filter((request) => request.status === "PENDING"),
    );
  }, [interactionData]);

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const parseDate = (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const date =
      typeof value === "number" ||
      (typeof value === "string" && /^\d+$/.test(value))
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

  // =====================================================
  // SCHEDULED LIVE STREAMS
  // =====================================================

  const scheduledLives = (data?.getMyScheduledLives || [])
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

  // =====================================================
  // AGORA REMOTE USER TRACK HANDLING
  // =====================================================

  const stopRemoteTracks = useCallback(() => {
    try {
      remoteVideoTrackRef.current?.stop();
    } catch (error) {
      console.warn("Remote video stop warning:", error);
    }

    try {
      remoteAudioTrackRef.current?.stop();
    } catch (error) {
      console.warn("Remote audio stop warning:", error);
    }

    remoteVideoTrackRef.current = null;
    remoteAudioTrackRef.current = null;
    setRemoteVideoUid(null);
  }, []);

  const handleUserPublished = useCallback(async (user, mediaType) => {
    const client = rtcClientRef.current;

    if (!client) return;

    try {
      // Subscribe to the viewer's published track.
      await client.subscribe(user, mediaType);

      if (mediaType === "audio") {
        remoteAudioTrackRef.current = user.audioTrack;

        // Play viewer's microphone audio on the astrologer's device.
        user.audioTrack?.play();

        console.log("Subscribed to viewer audio:", user.uid);
      }

      if (mediaType === "video") {
        remoteVideoTrackRef.current = user.videoTrack;

        const uid = String(user.uid);
        setRemoteVideoUid(uid);

        console.log("Subscribed to viewer video:", uid);

        // Wait for React to render the remote video container.
        requestAnimationFrame(() => {
          const container = document.getElementById(
            `interaction-viewer-${uid}`,
          );

          if (container && user.videoTrack) {
            user.videoTrack.play(container);
          }
        });
      }
    } catch (error) {
      console.error("Unable to subscribe to viewer track:", error);
    }
  }, []);

  const handleUserUnpublished = useCallback((user, mediaType) => {
    if (mediaType === "audio") {
      try {
        user.audioTrack?.stop();
      } catch {}

      if (remoteAudioTrackRef.current === user.audioTrack) {
        remoteAudioTrackRef.current = null;
      }
    }

    if (mediaType === "video") {
      try {
        user.videoTrack?.stop();
      } catch {}

      if (remoteVideoTrackRef.current === user.videoTrack) {
        remoteVideoTrackRef.current = null;
        setRemoteVideoUid(null);
      }
    }
  }, []);

  const handleUserLeft = useCallback(
    (user) => {
      const active = activeInteractionRef.current;

      if (
        active?.agoraUid != null &&
        String(active.agoraUid) === String(user.uid)
      ) {
        stopRemoteTracks();
        setInteractionNotice(
          "The viewer has disconnected from the live interaction.",
        );
        setActiveInteraction(null);
      }

      const client = rtcClientRef.current;

      if (client) {
        setViewerCount(client.remoteUsers.length);
      }
    },
    [stopRemoteTracks],
  );

  const registerRtcEvents = useCallback(
    (rtcClient) => {
      rtcClient.on("user-joined", () => {
        setViewerCount(rtcClient.remoteUsers.length);
      });

      rtcClient.on("user-left", handleUserLeft);

      rtcClient.on("user-published", handleUserPublished);

      rtcClient.on("user-unpublished", handleUserUnpublished);
    },
    [handleUserLeft, handleUserPublished, handleUserUnpublished],
  );

  // =====================================================
  // ACCEPT / REJECT INTERACTION REQUEST
  // =====================================================

  const handleRespondInteraction = async (request, action) => {
    if (!request?.id || interactionLoadingId) return;

    if (!isLive || !rtcClientRef.current) {
      alert("Your live session is not active.");
      return;
    }

    try {
      setInteractionLoadingId(request.id);
      setInteractionNotice("");

      const { data: responseData } =
        await respondLiveInteractionRequest({
          variables: {
            requestId: request.id,
            action,
          },
        });

      const updatedRequest =
        responseData?.respondLiveInteractionRequest;

      if (!updatedRequest) {
        throw new Error("Unable to process interaction request.");
      }

      setPendingInteractions((previous) =>
        previous.filter((item) => item.id !== request.id),
      );

      if (action === "ACCEPT") {
        setActiveInteraction({
          ...request,
          ...updatedRequest,
        });

        setInteractionNotice(
          `${request.interactionType} interaction accepted. Waiting for the viewer to connect...`,
        );
      } else {
        setInteractionNotice("Interaction request rejected.");
      }

      await refetchInteractions();
    } catch (error) {
      console.error("Respond interaction error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          `Unable to ${action.toLowerCase()} interaction request.`,
      );
    } finally {
      setInteractionLoadingId(null);
    }
  };

  // =====================================================
  // END ACTIVE INTERACTION
  // =====================================================

  const handleEndInteraction = async () => {
    const active = activeInteractionRef.current;

    if (!active?.id) {
      setInteractionNotice("No active interaction found.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to end this viewer interaction?",
      )
    ) {
      return;
    }

    try {
      setInteractionLoadingId(active.id);

      await endLiveInteraction({
        variables: {
          requestId: active.id,
        },
      });

      stopRemoteTracks();
      setActiveInteraction(null);
      activeInteractionRef.current = null;

      setInteractionNotice("Viewer interaction ended successfully.");

      await refetchInteractions();
    } catch (error) {
      console.error("End interaction error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Unable to end viewer interaction.",
      );
    } finally {
      setInteractionLoadingId(null);
    }
  };

  // =====================================================
  // AGORA CHAT CONNECTION
  // =====================================================

  const connectChat = useCallback(async (live) => {
    if (!live?.chatRoomId) {
      throw new Error("Chat room ID is missing from joinLive response.");
    }

    if (!live?.chatUserId || !live?.chatToken) {
      throw new Error(
        "Agora Chat credentials are missing from joinLive response.",
      );
    }

    const appKey =
      live.chatAppKey || process.env.NEXT_PUBLIC_AGORA_CHAT_APPKEY;

    if (!appKey) {
      throw new Error(
        "Agora Chat App Key is missing. Configure NEXT_PUBLIC_AGORA_CHAT_APPKEY.",
      );
    }

    const chatClient = new AgoraChat.connection({ appKey });

    chatClientRef.current = chatClient;

    chatClient.addEventHandler("agent-live-chat-handler", {
      onTextMessage: (msg) => {
        if (msg.chatType !== "chatRoom") return;

        if (String(msg.to) !== String(live.chatRoomId)) return;

        const messageId =
          msg.id ||
          `${msg.from || "viewer"}-${msg.time || Date.now()}-${msg.msg}`;

        if (messagesSeenRef.current.has(messageId)) return;

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

  // =====================================================
  // RESTORE ACTIVE LIVE AFTER PAGE REFRESH
  // =====================================================

  useEffect(() => {
    let cancelled = false;
    let rtcClient = null;
    let micTrack = null;
    let cameraTrack = null;
    let restoredChatClient = null;

    const restoreActiveLive = async () => {
      if (restoreAttemptRef.current || cancelled) return;

      let savedSession;

      try {
        const savedSessionText = localStorage.getItem(
          "dhwaniastro_active_live",
        );

        if (!savedSessionText) {
          setRecoveryRequired(false);
          return;
        }

        savedSession = JSON.parse(savedSessionText);

        if (!savedSession?.streamId || !savedSession?.channelName) {
          localStorage.removeItem("dhwaniastro_active_live");
          setRecoveryRequired(false);
          return;
        }

        restoreAttemptRef.current = true;
        setRestoringLive(true);
        setRecoveryRequired(true);
        setTitle(savedSession.title || "");
        setStreamId(savedSession.streamId);

        const { data: joinData } = await apolloClient.query({
          query: JOIN_LIVE,
          variables: {
            channelName: savedSession.channelName,
            role: "publisher",
          },
          fetchPolicy: "no-cache",
          errorPolicy: "none",
        });

        if (cancelled) return;

        const live = joinData?.joinLive;

        if (
          !live?.appId ||
          !live?.rtcToken ||
          !live?.channelName ||
          live?.uid == null ||
          !live?.chatRoomId ||
          !live?.chatUserId ||
          !live?.chatToken
        ) {
          throw new Error(
            "The backend did not return complete RTC and Chat credentials for the active live session.",
          );
        }

        const restoredLive = {
          ...live,
          id: savedSession.streamId,
          title: savedSession.title || "",
        };

        localStorage.setItem(
          "dhwaniastro_active_live",
          JSON.stringify({
            streamId: restoredLive.id,
            channelName: restoredLive.channelName,
            chatRoomId: restoredLive.chatRoomId,
            title: restoredLive.title,
          }),
        );

        if (cancelled) return;

        rtcClient = AgoraRTC.createClient({
          mode: "live",
          codec: "vp8",
        });

        rtcClientRef.current = rtcClient;
        registerRtcEvents(rtcClient);

        await rtcClient.setClientRole("host");

        await rtcClient.join(
          live.appId,
          live.channelName,
          live.rtcToken,
          live.uid,
        );

        if (cancelled) {
          await rtcClient.leave().catch(() => {});
          return;
        }

        await connectChat(restoredLive);
        restoredChatClient = chatClientRef.current;

        if (cancelled) return;

        micTrack = await AgoraRTC.createMicrophoneAudioTrack();

        if (cancelled) {
          micTrack.close();
          micTrack = null;
          return;
        }

        micTrackRef.current = micTrack;

        cameraTrack = await AgoraRTC.createCameraVideoTrack();

        if (cancelled) {
          cameraTrack.close();
          cameraTrack = null;
          return;
        }

        cameraTrackRef.current = cameraTrack;

        await rtcClient.publish([micTrack, cameraTrack]);

        if (cancelled) return;

        requestAnimationFrame(() => {
          if (
            !cancelled &&
            cameraTrack &&
            document.getElementById("local-player")
          ) {
            cameraTrack.play("local-player");
          }
        });

        setLiveInfo(restoredLive);
        setMessages([]);
        messagesSeenRef.current.clear();
        setViewerCount(rtcClient.remoteUsers.length);
        setIsMicMuted(false);
        setIsCameraPaused(false);
        setIsLive(true);
        setRecoveryRequired(false);

        console.log("Active live session restored successfully.");
      } catch (error) {
        if (
          cancelled ||
          error?.name === "AbortError" ||
          error?.name === "CanceledError"
        ) {
          console.info("Live restoration was cancelled.");
          return;
        }

        console.error("Restore active live error:", error);

        try {
          micTrack?.stop();
          micTrack?.close();
        } catch (cleanupError) {
          console.warn("Restore microphone cleanup warning:", cleanupError);
        }

        try {
          cameraTrack?.stop();
          cameraTrack?.close();
        } catch (cleanupError) {
          console.warn("Restore camera cleanup warning:", cleanupError);
        }

        if (restoredChatClient) {
          try {
            if (savedSession?.chatRoomId) {
              await restoredChatClient.leaveChatRoom({
                roomId: String(savedSession.chatRoomId),
              });
            }

            await restoredChatClient.close();
          } catch (cleanupError) {
            console.warn("Restore chat cleanup warning:", cleanupError);
          }
        }

        if (rtcClient) {
          try {
            await rtcClient.leave();
          } catch (cleanupError) {
            console.warn("Restore RTC cleanup warning:", cleanupError);
          }
        }

        if (micTrackRef.current === micTrack) {
          micTrackRef.current = null;
        }

        if (cameraTrackRef.current === cameraTrack) {
          cameraTrackRef.current = null;
        }

        if (chatClientRef.current === restoredChatClient) {
          chatClientRef.current = null;
        }

        if (rtcClientRef.current === rtcClient) {
          rtcClientRef.current = null;
        }

        if (!cancelled) {
          setIsLive(false);
          setLiveInfo(null);
          setRecoveryRequired(Boolean(savedSession?.streamId));
        }
      } finally {
        if (!cancelled) setRestoringLive(false);
        restoreAttemptRef.current = false;
      }
    };

    restoreTimerRef.current = window.setTimeout(() => {
      restoreActiveLive();
    }, 0);

    return () => {
      cancelled = true;

      if (restoreTimerRef.current) {
        window.clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
    };
  }, [apolloClient, connectChat, registerRtcEvents]);

  // =====================================================
  // MUTE / UNMUTE MICROPHONE
  // =====================================================

  const handleToggleMicrophone = async () => {
    const micTrack = micTrackRef.current;

    if (!isLive || !micTrack) {
      alert("Microphone is not available.");
      return;
    }

    try {
      const shouldMute = !isMicMuted;

      await micTrack.setEnabled(!shouldMute);
      setIsMicMuted(shouldMute);
    } catch (error) {
      console.error("Microphone toggle error:", error);
      alert("Unable to change microphone state.");
    }
  };

  // =====================================================
  // PAUSE / RESUME CAMERA
  // =====================================================

  const handleToggleCamera = async () => {
    const cameraTrack = cameraTrackRef.current;

    if (!isLive || !cameraTrack) {
      alert("Camera is not available.");
      return;
    }

    try {
      const shouldPause = !isCameraPaused;

      await cameraTrack.setEnabled(!shouldPause);

      setIsCameraPaused(shouldPause);

      const localPlayer = document.getElementById("local-player");

      if (shouldPause) {
        cameraTrack.stop();

        if (localPlayer) {
          localPlayer.querySelectorAll("video").forEach((video) => {
            video.style.display = "none";
          });
        }
      } else {
        cameraTrack.play("local-player");

        if (localPlayer) {
          localPlayer.querySelectorAll("video").forEach((video) => {
            video.style.display = "block";
          });
        }
      }
    } catch (error) {
      console.error("Camera toggle error:", error);
      alert("Unable to change camera state.");
    }
  };

  // =====================================================
  // START LIVE
  // =====================================================

  const handleStartLive = async () => {
    if (starting) return;

    let rtcClient = null;
    let currentLive = null;
    let createdStreamId = null;
    let liveServiceEnabled = false;
    let effectiveAstrologerId = null;

    try {
      const serviceStatus = JSON.parse(
        localStorage.getItem("service_status") || "null",
      );

      if (serviceStatus?.isLiveActive === false) {
        alert("Please Enable Your Live Streaming Service.");
        return;
      }

      if (!title.trim()) {
        alert("Enter stream title.");
        return;
      }

      setStarting(true);
      setMessages([]);
      messagesSeenRef.current.clear();
      setViewerCount(0);
      setIsMicMuted(false);
      setIsCameraPaused(false);
      setPendingInteractions([]);
      setActiveInteraction(null);
      setInteractionNotice("");

      const astroUser = JSON.parse(
        localStorage.getItem("astro_user") || "{}",
      );

      effectiveAstrologerId = astrologerId || astroUser.id;

      if (!effectiveAstrologerId) {
        throw new Error(
          "Astrologer ID is missing. Please pass the logged-in astrologer ID to AgentLiveStreaming.",
        );
      }

      // 1. Enable LIVE service.
      const { data: toggleData } = await startLiveToggleServices({
        variables: {
          astrologerId: effectiveAstrologerId,
          serviceType: "LIVE",
          status: true,
        },
      });

      if (!toggleData?.startLiveToggleServices?.success) {
        throw new Error(
          toggleData?.startLiveToggleServices?.message ||
            "Unable to enable LIVE service.",
        );
      }

      liveServiceEnabled = true;

      // 2. Create stream.
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

      const activeLiveSession = {
        streamId: stream.id,
        channelName: stream.channelName,
        title: stream.title?.trim() || title.trim(),
      };

      localStorage.setItem(
        "dhwaniastro_active_live",
        JSON.stringify(activeLiveSession),
      );

      setStreamId(stream.id);
      setTitle(activeLiveSession.title);

      // 3. Get publisher credentials.
      const { data: joinData } = await apolloClient.query({
        query: JOIN_LIVE,
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
        throw new Error("Missing Agora RTC publisher credentials.");
      }

      if (!live.chatRoomId) {
        throw new Error("Chat room is missing for this stream.");
      }

      currentLive = {
        ...live,
        id: stream.id,
        title: stream.title?.trim() || title.trim(),
      };

      setTitle(currentLive.title);
      setLiveInfo(currentLive);

      localStorage.setItem(
        "dhwaniastro_active_live",
        JSON.stringify({
          streamId: currentLive.id,
          channelName: currentLive.channelName,
          chatRoomId: currentLive.chatRoomId,
          title: currentLive.title,
        }),
      );

      // 4. Join Agora RTC channel.
      rtcClient = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      rtcClientRef.current = rtcClient;

      registerRtcEvents(rtcClient);

      await rtcClient.setClientRole("host");

      await rtcClient.join(
        live.appId,
        live.channelName,
        live.rtcToken,
        live.uid,
      );

      // 5. Connect Agora Chat.
      await connectChat(currentLive);

      // 6. Create microphone and camera tracks.
      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = mic;

      const camera = await AgoraRTC.createCameraVideoTrack();
      cameraTrackRef.current = camera;

      await mic.setEnabled(true);
      await camera.setEnabled(true);

      // 7. Publish astrologer's tracks.
      await rtcClient.publish([mic, camera]);

      camera.play("local-player");

      setIsMicMuted(false);
      setIsCameraPaused(false);
      setIsLive(true);
      setRecoveryRequired(false);

      localStorage.setItem(
        "dhwaniastro_active_live",
        JSON.stringify({
          streamId: currentLive.id,
          channelName: currentLive.channelName,
          chatRoomId: currentLive.chatRoomId,
          title: currentLive.title,
        }),
      );

      await refetch();

      alert(
        "Live started successfully! Your call and chat services have been temporarily disabled. They will be re-enabled automatically once you end the live session.",
      );
    } catch (error) {
      console.error("Start live error:", error);

      try {
        cameraTrackRef.current?.stop();
        cameraTrackRef.current?.close();
        micTrackRef.current?.stop();
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
              console.warn("Start failure chat-room cleanup:", leaveError);
            }
          }

          try {
            await chatClient.close();
          } catch (closeError) {
            console.warn("Start failure chat cleanup:", closeError);
          }

          chatClientRef.current = null;
        }

        if (rtcClient) {
          try {
            await rtcClient.leave();
          } catch (rtcCleanupError) {
            console.warn("Start failure RTC cleanup:", rtcCleanupError);
          }
        }

        if (createdStreamId) {
          try {
            await endLive({
              variables: {
                streamId: createdStreamId,
              },
            });

            localStorage.removeItem("dhwaniastro_active_live");
            await refetch();
          } catch (endCleanupError) {
            console.warn(
              "Failed to reset stream after start failure:",
              endCleanupError,
            );
          }
        }

        if (liveServiceEnabled && effectiveAstrologerId) {
          try {
            await startLiveToggleServices({
              variables: {
                astrologerId: effectiveAstrologerId,
                serviceType: "LIVE",
                status: false,
              },
            });

            liveServiceEnabled = false;
          } catch (toggleCleanupError) {
            console.error(
              "Failed to disable LIVE service after start failure:",
              toggleCleanupError,
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
      setRecoveryRequired(
        Boolean(localStorage.getItem("dhwaniastro_active_live")),
      );
      setIsMicMuted(false);
      setIsCameraPaused(false);

      const localPlayer = document.getElementById("local-player");

      if (localPlayer) {
        localPlayer.innerHTML = "";
      }

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to start live.",
      );
    } finally {
      setStarting(false);
    }
  };

  // =====================================================
  // SEND ASTROLOGER MESSAGE
  // =====================================================

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
        `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  // =====================================================
  // END LIVE
  // =====================================================

  const handleEndLive = async () => {
    if (ending) return;

    setEnding(true);

    let astrologerIdForEnd = null;
    let backendStreamEnded = false;

    try {
      const astroUser = JSON.parse(
        localStorage.getItem("astro_user") || "{}",
      );

      astrologerIdForEnd = astrologerId || astroUser.id || null;

      const savedSession = JSON.parse(
        localStorage.getItem("dhwaniastro_active_live") || "{}",
      );

      const currentStreamId = streamId || savedSession.streamId;

      // 1. Stop remote viewer tracks.
      stopRemoteTracks();

      // 2. Stop camera.
      if (cameraTrackRef.current) {
        try {
          cameraTrackRef.current.stop();
          cameraTrackRef.current.close();
        } catch (error) {
          console.warn("Camera cleanup warning:", error);
        }

        cameraTrackRef.current = null;
      }

      // 3. Stop microphone.
      if (micTrackRef.current) {
        try {
          micTrackRef.current.stop();
          micTrackRef.current.close();
        } catch (error) {
          console.warn("Microphone cleanup warning:", error);
        }

        micTrackRef.current = null;
      }

      // 4. Leave Agora RTC.
      const rtcClient = rtcClientRef.current;

      if (rtcClient) {
        try {
          await rtcClient.unpublish();
        } catch (error) {
          console.warn("RTC unpublish warning:", error);
        }

        try {
          await rtcClient.leave();
        } catch (error) {
          console.warn("RTC leave warning:", error);
        }

        rtcClientRef.current = null;
      }

      // 5. Leave Agora Chat.
      const chatClient = chatClientRef.current;

      if (chatClient) {
        const chatRoomId =
          liveInfo?.chatRoomId || savedSession.chatRoomId;

        if (chatRoomId) {
          try {
            await chatClient.leaveChatRoom({
              roomId: String(chatRoomId),
            });
          } catch (error) {
            console.warn("Leave chat room warning:", error);
          }
        }

        try {
          await chatClient.close();
        } catch (error) {
          console.warn("Chat close warning:", error);
        }

        chatClientRef.current = null;
      }

      // 6. End backend stream.
      if (!currentStreamId) {
        throw new Error(
          "Live stream ID not found. Please refresh and try again.",
        );
      }

      await endLive({
        variables: {
          streamId: currentStreamId,
        },
      });

      backendStreamEnded = true;

      localStorage.removeItem("dhwaniastro_active_live");

      // The backend endLive resolver should also mark all PENDING and
      // ACCEPTED interaction requests for this stream as ENDED.

      // 7. Restore astrologer's CHAT/CALL services.
      if (!astrologerIdForEnd) {
        throw new Error(
          "Astrologer ID is missing; the stream ended but services could not be restored.",
        );
      }

      const { data: toggleData } = await startLiveToggleServices({
        variables: {
          astrologerId: astrologerIdForEnd,
          serviceType: "LIVE",
          status: false,
        },
      });

      if (!toggleData?.startLiveToggleServices?.success) {
        throw new Error(
          toggleData?.startLiveToggleServices?.message ||
            "Live ended, but unable to re-enable CHAT and CALL services.",
        );
      }

      // 8. Reset frontend state.
      setIsLive(false);
      setStreamId(null);
      setLiveInfo(null);
      setRecoveryRequired(false);
      setViewerCount(0);
      setMessages([]);
      setIsMicMuted(false);
      setIsCameraPaused(false);
      setMessage("");
      setPendingInteractions([]);
      setActiveInteraction(null);
      activeInteractionRef.current = null;
      setInteractionNotice("");
      messagesSeenRef.current.clear();

      const localPlayer = document.getElementById("local-player");

      if (localPlayer) {
        localPlayer.innerHTML = "";
      }

      const remotePlayer = document.getElementById(
        "interaction-viewer-container",
      );

      if (remotePlayer) {
        remotePlayer.innerHTML = "";
      }

      await refetch();

      localStorage.removeItem("service_status");

      alert("Live ended successfully. Call and chat services are enabled.");
    } catch (error) {
      console.error("End live error:", error);

      if (backendStreamEnded) {
        setIsLive(false);
        setStreamId(null);
        setLiveInfo(null);
        setRecoveryRequired(false);
        setViewerCount(0);
        setPendingInteractions([]);
        setActiveInteraction(null);
        activeInteractionRef.current = null;

        const localPlayer = document.getElementById("local-player");

        if (localPlayer) {
          localPlayer.innerHTML = "";
        }
      }

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to end live.",
      );
    } finally {
      setEnding(false);
    }
  };

  // =====================================================
  // SCHEDULE LIVE
  // =====================================================

  const handleSchedule = async () => {
    if (scheduling) return;

    try {
      if (
        !scheduleTitle.trim() ||
        !scheduleDate ||
        !scheduleTime ||
        !scheduleEndTime
      ) {
        alert("Please fill in the title, date, start time, and end time.");
        return;
      }

      const scheduledDateTime = new Date(
        `${scheduleDate}T${scheduleTime}`,
      );

      const scheduledEndDateTime = new Date(
        `${scheduleDate}T${scheduleEndTime}`,
      );

      if (
        Number.isNaN(scheduledDateTime.getTime()) ||
        Number.isNaN(scheduledEndDateTime.getTime())
      ) {
        alert("Please select a valid date and time.");
        return;
      }

      if (scheduledDateTime <= new Date()) {
        alert("Please select a future date and time.");
        return;
      }

      if (scheduledEndDateTime <= scheduledDateTime) {
        alert("End time must be greater than start time.");
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
          "Failed to schedule live.",
      );
    }
  };

  // =====================================================
  // OPEN EDIT FORM
  // =====================================================

  const handleEditClick = (live) => {
    if (live.status !== "SCHEDULED") {
      alert("Only scheduled lives can be edited.");
      return;
    }

    const scheduledDate = parseDate(live.scheduledAt);
    const scheduledEndDate = parseDate(live.scheduledEndAt);

    if (!scheduledDate || !scheduledEndDate) {
      alert("This session has an invalid or missing schedule.");
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

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    if (updatingLive) return;

    setEditingLiveId(null);
    setEditTitle("");
    setEditDate("");
    setEditTime("");
    setEditEndTime("");
  };

  // =====================================================
  // UPDATE SCHEDULED LIVE
  // =====================================================

  const handleUpdateScheduledLive = async (e) => {
    e.preventDefault();

    if (!editingLiveId || updatingLive) return;

    if (!editTitle.trim() || !editDate || !editTime || !editEndTime) {
      alert("Please fill in the title, date, start time, and end time.");
      return;
    }

    const scheduledDateTime = new Date(`${editDate}T${editTime}`);
    const scheduledEndDateTime = new Date(`${editDate}T${editEndTime}`);

    if (
      Number.isNaN(scheduledDateTime.getTime()) ||
      Number.isNaN(scheduledEndDateTime.getTime())
    ) {
      alert("Please select a valid date and time.");
      return;
    }

    if (scheduledDateTime <= new Date()) {
      alert("Please select a future date and time.");
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
          "Failed to update scheduled live.",
      );
    } finally {
      setUpdatingLive(false);
    }
  };

  // =====================================================
  // DELETE SCHEDULED LIVE
  // =====================================================

  const handleDeleteScheduledLive = async (live) => {
    if (deletingLiveId || updatingLive) return;

    if (live.status !== "SCHEDULED") {
      alert("Only scheduled lives can be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        live.title || "Untitled Live"
      }"?`,
    );

    if (!confirmed) return;

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
        handleCancelEdit();
      }

      await refetch();

      alert("Scheduled live deleted successfully.");
    } catch (error) {
      console.error("Delete scheduled live error:", error);

      alert(
        error?.graphQLErrors?.[0]?.message ||
          error?.message ||
          "Failed to delete scheduled live.",
      );
    } finally {
      setDeletingLiveId(null);
    }
  };

  // =====================================================
  // COMPONENT CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      console.log("LiveEvent component cleanup started");

      const chatClient = chatClientRef.current;
      const rtcClient = rtcClientRef.current;
      const cameraTrack = cameraTrackRef.current;
      const micTrack = micTrackRef.current;

      try {
        remoteVideoTrackRef.current?.stop();
        remoteAudioTrackRef.current?.stop();
      } catch (error) {
        console.warn("Remote track cleanup warning:", error);
      }

      remoteVideoTrackRef.current = null;
      remoteAudioTrackRef.current = null;

      if (cameraTrack) {
        try {
          cameraTrack.stop();
          cameraTrack.close();
        } catch (error) {
          console.warn("Camera cleanup warning:", error);
        }

        cameraTrackRef.current = null;
      }

      if (micTrack) {
        try {
          micTrack.stop();
          micTrack.close();
        } catch (error) {
          console.warn("Microphone cleanup warning:", error);
        }

        micTrackRef.current = null;
      }

      if (chatClient) {
        Promise.resolve()
          .then(() => chatClient.close())
          .catch((error) => {
            console.warn("Chat cleanup warning:", error);
          });

        chatClientRef.current = null;
      }

      if (rtcClient) {
        Promise.resolve()
          .then(() => rtcClient.leave())
          .catch((error) => {
            console.warn("RTC cleanup warning:", error);
          });

        rtcClientRef.current = null;
      }

      console.log("LiveEvent component cleanup completed");
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* =================================================
            LIVE VIDEO AND CONTROLS
        ================================================= */}

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
            type="text"
            className="w-full border rounded-lg p-3 mb-4"
            placeholder="Enter Live Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLive || starting || restoringLive}
            required
            maxLength={100}
          />

          {restoringLive && (
            <p className="text-sm text-blue-600 mb-3">
              Reconnecting to your previous live session. Please wait...
            </p>
          )}

          {recoveryRequired && !restoringLive && !isLive && (
            <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                A previous live session is still recorded. Do not start a
                new live session until you reconnect or end the previous one.
              </p>

              <button
                type="button"
                onClick={handleEndLive}
                disabled={ending}
                className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {ending
                  ? "Ending Previous Live..."
                  : "End Previous Live Session"}
              </button>
            </div>
          )}

          {/* Astrologer's local video */}
          <div
            id="local-player"
            className="w-full h-[500px] rounded-xl overflow-hidden bg-black"
          />

          {/* Accepted viewer's remote video */}
          {activeInteraction?.interactionType === "VIDEO" && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  Viewer Video
                </h3>

                {remoteVideoUid && (
                  <span className="text-xs text-green-600">
                    Connected
                  </span>
                )}
              </div>

              <div
                id="interaction-viewer-container"
                className="w-full h-[280px] rounded-xl overflow-hidden bg-gray-900"
              >
                {remoteVideoUid ? (
                  <div
                    id={`interaction-viewer-${remoteVideoUid}`}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm">
                    Waiting for viewer video...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live controls */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            {!isLive ? (
              <button
                type="button"
                onClick={handleStartLive}
                disabled={
                  starting ||
                  ending ||
                  restoringLive ||
                  recoveryRequired ||
                  !title.trim()
                }
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition"
              >
                {restoringLive
                  ? "Reconnecting..."
                  : starting
                    ? "Starting..."
                    : "Start Live Now"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleMicrophone}
                  disabled={ending || !micTrackRef.current}
                  aria-pressed={isMicMuted}
                  className={`px-5 py-3 rounded-lg font-semibold text-white transition disabled:opacity-50 ${
                    isMicMuted
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isMicMuted ? "🔇 Unmute Mic" : "🎤 Mute Mic"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleCamera}
                  disabled={ending || !cameraTrackRef.current}
                  aria-pressed={isCameraPaused}
                  className={`px-5 py-3 rounded-lg font-semibold text-white transition disabled:opacity-50 ${
                    isCameraPaused
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {isCameraPaused ? "▶ Resume Video" : "⏸ Pause Video"}
                </button>

                <button
                  type="button"
                  onClick={handleEndLive}
                  disabled={ending}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition"
                >
                  {ending ? "Ending..." : "End Live"}
                </button>
              </>
            )}
          </div>

          {/* Microphone / camera status */}
          {isLive && (
            <div className="flex flex-wrap gap-3 mt-4">
              <span
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  isMicMuted
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isMicMuted ? "🔇" : "🎤"} Microphone:{" "}
                {isMicMuted ? "Muted" : "On"}
              </span>

              <span
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                  isCameraPaused
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isCameraPaused ? "⏸" : "📹"} Camera:{" "}
                {isCameraPaused ? "Paused" : "On"}
              </span>
            </div>
          )}
        </div>

        {/* =================================================
            LIVE CHAT
        ================================================= */}

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
                    {msg.sender
                      ?.split("_")[0]
                      ?.replace(/^./, (char) => char.toUpperCase())}
                  </p>

                  {msg.type === "gift" ? (
                    <p className="font-semibold text-orange-600">
                      🎁 {msg.text}
                    </p>
                  ) : (
                    <p className="text-gray-700">{msg.text}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
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

        {/* =================================================
            RIGHT PANEL
        ================================================= */}

        <div className="space-y-6">
          {/* Incoming interaction requests */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Viewer Requests
              </h3>

              {pendingInteractions.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                  {pendingInteractions.length} New
                </span>
              )}
            </div>

            {!isLive ? (
              <p className="text-sm text-gray-500">
                Start your live session to receive viewer requests.
              </p>
            ) : pendingInteractions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No pending audio/video requests.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingInteractions.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          Viewer Request
                        </p>

                        <p className="text-sm text-gray-600 mt-1">
                          Type:{" "}
                          <span className="font-semibold">
                            {request.interactionType === "VIDEO"
                              ? "📹 Video"
                              : "🎤 Audio"}
                          </span>
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Requested:{" "}
                          {request.requestedAt
                            ? new Date(
                                request.requestedAt,
                              ).toLocaleTimeString("en-IN")
                            : "-"}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleRespondInteraction(request, "ACCEPT")
                        }
                        disabled={
                          Boolean(interactionLoadingId) ||
                          Boolean(activeInteraction)
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        {interactionLoadingId === request.id
                          ? "Processing..."
                          : "Accept"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRespondInteraction(request, "REJECT")
                        }
                        disabled={Boolean(interactionLoadingId)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {interactionNotice && (
              <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                {interactionNotice}
              </p>
            )}
          </div>

          {/* Active interaction */}
          {activeInteraction && (
            <div className="bg-white rounded-xl shadow p-4 border border-green-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold">
                  Active Interaction
                </h3>

                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  Accepted
                </span>
              </div>

              <p className="text-sm text-gray-700">
                Interaction type:{" "}
                <strong>{activeInteraction.interactionType}</strong>
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Viewer Agora UID: {activeInteraction.agoraUid}
              </p>

              <p className="text-sm text-green-700 mt-3">
                {remoteVideoUid ||
                remoteAudioTrackRef.current
                  ? "Viewer media connected."
                  : "Waiting for viewer to publish audio/video..."}
              </p>

              <button
                type="button"
                onClick={handleEndInteraction}
                disabled={Boolean(interactionLoadingId)}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {interactionLoadingId === activeInteraction.id
                  ? "Ending..."
                  : "End Viewer Interaction"}
              </button>
            </div>
          )}

          {/* Schedule live */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-4">Schedule Live</h3>

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

          {/* Statistics */}
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

      {/* =================================================
          SCHEDULED LIVE STREAMS TABLE
      ================================================= */}

      <div className="mt-8 bg-white rounded-xl shadow p-6">
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

        {/* Edit form */}
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

        {/* Table */}
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
                  <th className="border px-4 py-3 whitespace-nowrap">#</th>
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
                  <tr key={live.id} className="hover:bg-gray-50 transition">
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
                            updatingLive || deletingLiveId === live.id
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledLive(live)}
                          disabled={
                            deletingLiveId === live.id || updatingLive
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