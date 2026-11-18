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

  // Tracks the Agora UID of the viewer participating in the interaction.
  const remoteViewerUidRef = useRef(null);

  const apolloClient = useApolloClient();

  // Keep the ref synchronized with state for Agora event callbacks.
  useEffect(() => {
    activeInteractionRef.current = activeInteraction;
  }, [activeInteraction]);

  const messagesContainerRef = useRef(null);
 
  

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const [startLive] = useMutation(START_LIVE);
  const [endLive] = useMutation(END_LIVE);
  const [showStartLiveModal, setShowStartLiveModal] = useState(false);
  const [scheduleLive, { loading: scheduling }] = useMutation(SCHEDULE_LIVE);

  const [updateScheduledLive] = useMutation(UPDATE_SCHEDULED_LIVE);
  const [deleteScheduledLive] = useMutation(DELETE_SCHEDULED_LIVE);

  const [startLiveToggleServices] = useMutation(START_LIVE_TOGGLE_SERVICES);

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

  const { data: interactionData, refetch: refetchInteractions } = useQuery(
    GET_PENDING_LIVE_INTERACTIONS,
    {
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
    },
  );

  // Update incoming request list whenever polling returns new data.
  useEffect(() => {
    const requests = interactionData?.getPendingLiveInteractions || [];

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
        live.status === "SCHEDULED" && endDate && endDate.getTime() > Date.now()
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
    remoteViewerUidRef.current = null;

    setRemoteVideoUid(null);

    const container = document.getElementById("interaction-viewer-container");

    if (container) {
      container.innerHTML = "";
    }
  }, []);

  // Subscribe to the accepted viewer's published audio/video tracks.
  const handleUserPublished = useCallback(async (user, mediaType) => {
    const client = rtcClientRef.current;
    const active = activeInteractionRef.current;

    if (!client || !active || !user) return;

    // The request must contain the viewer's Agora UID.
    // uid is supported as a fallback for older API responses.
    const expectedUid = active.agoraUid ?? active.uid;

    // Ignore all other viewers.
    if (expectedUid != null && String(expectedUid) !== String(user.uid)) {
      return;
    }

    try {
      await client.subscribe(user, mediaType);

      remoteViewerUidRef.current = String(user.uid);

      // -----------------------------
      // Viewer audio
      // -----------------------------
      if (mediaType === "audio") {
        if (remoteAudioTrackRef.current) {
          try {
            remoteAudioTrackRef.current.stop();
          } catch {}
        }

        remoteAudioTrackRef.current = user.audioTrack;

        if (user.audioTrack) {
          user.audioTrack.play();
        }

        setInteractionNotice("Viewer microphone connected.");

        console.log("Subscribed to viewer audio:", user.uid);
      }

      // -----------------------------
      // Viewer video
      // -----------------------------
      if (mediaType === "video") {
        if (remoteVideoTrackRef.current) {
          try {
            remoteVideoTrackRef.current.stop();
          } catch {}
        }

        remoteVideoTrackRef.current = user.videoTrack;

        setRemoteVideoUid(String(user.uid));

        setInteractionNotice("Viewer video connected.");

        console.log("Subscribed to viewer video:", user.uid);
      }
    } catch (error) {
      console.error("Unable to subscribe to viewer track:", error);

      setInteractionNotice(
        error?.message || "Unable to connect to the viewer's audio/video.",
      );
    }
  }, []);

  // Play remote video after React renders the video container.
  useEffect(() => {
    if (!remoteVideoUid) return;

    if (activeInteraction?.interactionType !== "VIDEO") {
      return;
    }

    const videoTrack = remoteVideoTrackRef.current;

    if (!videoTrack) return;

    const containerId = `interaction-viewer-${remoteVideoUid}`;

    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const playVideo = () => {
      if (cancelled) return;

      const container = document.getElementById(containerId);

      if (!container) {
        attempts += 1;

        if (attempts < 20) {
          timer = window.setTimeout(playVideo, 100);
        }

        return;
      }

      try {
        videoTrack.play(container);
      } catch (error) {
        console.error("Unable to play viewer video:", error);

        setInteractionNotice("Unable to display viewer video.");
      }
    };

    playVideo();

    return () => {
      cancelled = true;

      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [remoteVideoUid, activeInteraction?.interactionType]);

  // Handle viewer disabling their microphone or camera.
  // Do not clear the active interaction here because the viewer
  // may temporarily mute or disable their camera.
  const handleUserUnpublished = useCallback((user, mediaType) => {
    if (!user) return;

    if (
      remoteViewerUidRef.current != null &&
      String(remoteViewerUidRef.current) !== String(user.uid)
    ) {
      return;
    }

    if (mediaType === "audio") {
      try {
        user.audioTrack?.stop();
      } catch {}

      if (remoteAudioTrackRef.current === user.audioTrack) {
        remoteAudioTrackRef.current = null;
      }

      setInteractionNotice("Viewer microphone is currently unavailable.");
    }

    if (mediaType === "video") {
      try {
        user.videoTrack?.stop();
      } catch {}

      if (remoteVideoTrackRef.current === user.videoTrack) {
        remoteVideoTrackRef.current = null;
        setRemoteVideoUid(null);
      }

      setInteractionNotice("Viewer camera is currently unavailable.");
    }
  }, []);

  // Handle viewer leaving Agora RTC.
  const handleUserLeft = useCallback(
    (user) => {
      const active = activeInteractionRef.current;

      const expectedUid = active?.agoraUid ?? active?.uid;

      if (
        active &&
        expectedUid != null &&
        String(expectedUid) === String(user.uid)
      ) {
        stopRemoteTracks();

        setInteractionNotice(
          "The viewer has disconnected from the live interaction.",
        );

        setActiveInteraction(null);
        activeInteractionRef.current = null;
      }

      const client = rtcClientRef.current;

      if (client) {
        setViewerCount(client.remoteUsers.length);
      }
    },
    [stopRemoteTracks],
  );

  // Register Agora RTC event listeners.
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
    if (!request?.id) {
      console.error("Cannot respond to interaction: request ID is missing.");
      return;
    }

    if (!["ACCEPT", "REJECT"].includes(action)) {
      console.error("Invalid interaction action:", action);
      return;
    }

    // Prevent multiple simultaneous responses.
    if (interactionLoadingId) {
      return;
    }

    // Live session is required for both ACCEPT and REJECT.
    if (!isLive) {
      alert("Your live session is not active.");
      return;
    }

    // Agora RTC client is required only for ACCEPT.
    // REJECT must work even if the RTC client is unavailable.
    if (action === "ACCEPT" && !rtcClientRef.current) {
      alert("Agora connection is not ready. Please wait and try again.");
      return;
    }

    // Do not accept another interaction while one is active.
    if (action === "ACCEPT" && activeInteractionRef.current) {
      alert("You already have an active viewer interaction.");
      return;
    }

    try {
      setInteractionLoadingId(request.id);
      setInteractionNotice("");

      console.log("Responding to interaction:", {
        requestId: request.id,
        action,
        interactionType: request.interactionType,
      });

      // =========================================
      // CALL GRAPHQL MUTATION
      // =========================================

      const { data: responseData } = await respondLiveInteractionRequest({
        variables: {
          requestId: request.id,
          action,
        },
        fetchPolicy: "no-cache",
      });

      const updatedRequest = responseData?.respondLiveInteractionRequest;

      if (!updatedRequest) {
        throw new Error("Unable to process interaction request.");
      }

      console.log("Interaction response successful:", updatedRequest);

      // =========================================
      // REMOVE PROCESSED REQUEST FROM UI
      // =========================================

      setPendingInteractions((previous) =>
        previous.filter((item) => item.id !== request.id),
      );

      // =========================================
      // ACCEPT FLOW
      // =========================================

      if (action === "ACCEPT") {
        const acceptedInteraction = {
          ...request,
          ...updatedRequest,
        };

        // Update ref immediately for Agora callbacks.
        activeInteractionRef.current = acceptedInteraction;

        setActiveInteraction(acceptedInteraction);

        // Clear previous remote tracks.
        stopRemoteTracks();

        setInteractionNotice(
          `${
            acceptedInteraction.interactionType || "Viewer"
          } interaction accepted. Waiting for the viewer to connect...`,
        );
      }

      // =========================================
      // REJECT FLOW
      // =========================================

      if (action === "REJECT") {
        setInteractionNotice("Interaction request rejected successfully.");
      }

      // =========================================
      // REFRESH PENDING REQUESTS
      // =========================================

      try {
        await refetchInteractions();
      } catch (refreshError) {
        console.warn(
          "Unable to refresh pending interaction requests:",
          refreshError,
        );
      }
    } catch (error) {
      console.error("Respond interaction error:", error);

      // Restore request if mutation failed.
      setPendingInteractions((previous) => {
        const alreadyExists = previous.some((item) => item.id === request.id);

        return alreadyExists ? previous : [request, ...previous];
      });

      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.result?.errors?.[0]?.message ||
        error?.message ||
        `Unable to ${action.toLowerCase()} interaction request.`;

      alert(errorMessage);
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
      !window.confirm("Are you sure you want to end this viewer interaction?")
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

      activeInteractionRef.current = null;
      setActiveInteraction(null);

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

    const appKey = live.chatAppKey || process.env.NEXT_PUBLIC_AGORA_CHAT_APPKEY;

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
         console.log("123456789", msg, msg.from , msg.to);

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
          (isGift ? payload.senderName : null) || msg.from || "Viewer";

        const text = isGift
          ? `sent ${payload.quantity ?? 1} x ${payload.giftName || "gift"}`
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
        if (!cancelled) {
          setRestoringLive(false);
        }

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

  // Attach the local camera only after the live-studio DOM has mounted.
  useEffect(() => {
    if (!isLive || !cameraTrackRef.current) return;

    const cameraTrack = cameraTrackRef.current;
    let frameId = requestAnimationFrame(() => {
      const player = document.getElementById("local-player");
      if (player && cameraTrackRef.current === cameraTrack) {
        cameraTrack.play(player);
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isLive]);

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

      activeInteractionRef.current = null;
      setActiveInteraction(null);

      stopRemoteTracks();

      setInteractionNotice("");

      const astroUser = JSON.parse(localStorage.getItem("astro_user") || "{}");

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

      // The live studio mounts only after isLive becomes true.
      // The effect below attaches the published camera track after that render.

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

      activeInteractionRef.current = null;
      setActiveInteraction(null);

      stopRemoteTracks();

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
      const astroUser = JSON.parse(localStorage.getItem("astro_user") || "{}");

      astrologerIdForEnd = astrologerId || astroUser.id || null;

      const savedSession = JSON.parse(
        localStorage.getItem("dhwaniastro_active_live") || "{}",
      );

      const currentStreamId = streamId || savedSession.streamId;

      // 1. Stop remote viewer tracks and interaction.
      stopRemoteTracks();

      activeInteractionRef.current = null;
      setActiveInteraction(null);
      setPendingInteractions([]);

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
        const chatRoomId = liveInfo?.chatRoomId || savedSession.chatRoomId;

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

      // The backend endLive resolver should also mark all PENDING
      // and ACCEPTED interaction requests for this stream as ENDED.

      // 7. Restore astrologer's LIVE service.
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

      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

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
      `Are you sure you want to delete "${live.title || "Untitled Live"}"?`,
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
      remoteViewerUidRef.current = null;

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
          .catch((error) => console.warn("Chat cleanup warning:", error));
        chatClientRef.current = null;
      }

      if (rtcClient) {
        Promise.resolve()
          .then(() => rtcClient.leave())
          .catch((error) => console.warn("RTC cleanup warning:", error));
        rtcClientRef.current = null;
      }

      console.log("LiveEvent component cleanup completed");
    };
  }, []);

  return (
    <>
      {/* OFFLINE DASHBOARD: Go Live + scheduling tools remain available */}
      {!isLive && (
        <main className="min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/70 via-slate-50 to-rose-50/70 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            {restoringLive && (
              <div className="mb-5 rounded-2xl border border-blue-200/70 bg-white/70 p-4 text-sm text-blue-700 shadow-lg shadow-blue-100/40 backdrop-blur-xl">
                <i className="fa-solid fa-circle-notch mr-2 animate-spin" />
                Reconnecting to your previous live session. Please wait...
              </div>
            )}
            {recoveryRequired && !restoringLive && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-lg backdrop-blur-xl">
                <p className="font-semibold text-amber-900">
                  Previous Live Session Found
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  A previous live session is still recorded. End that session
                  before starting a new one.
                </p>
                <button
                  type="button"
                  onClick={handleEndLive}
                  disabled={ending}
                  className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-200/60 transition hover:bg-red-700 disabled:opacity-50"
                >
                  {ending
                    ? "Ending Previous Live..."
                    : "End Previous Live Session"}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              {/* Go Live glass card */}
              <section className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-[30px] border border-white/80 bg-white/55 px-6 py-10 text-center shadow-[0_25px_80px_rgba(51,65,85,0.10)] backdrop-blur-2xl sm:min-h-[390px] sm:px-10">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-rose-300/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/90 bg-gradient-to-br from-rose-100/90 to-white/80 text-rose-600 shadow-[0_12px_35px_rgba(244,63,94,0.15)]">
                  <i className="fa-solid fa-tower-broadcast text-3xl" />
                </div>
                <span className="relative rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                  Your live workspace
                </span>
                <h1 className="relative mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Ready to go live?
                </h1>
                <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Connect with your audience in real time. Start a new session
                  whenever you are ready.
                </p>
                <button
                  type="button"
                  onClick={() => setShowStartLiveModal(true)}
                  disabled={
                    starting || ending || restoringLive || recoveryRequired
                  }
                  className="relative mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 px-9 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(225,29,72,0.28)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(225,29,72,0.34)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-circle-play text-lg" />
                  Go Live Right Now
                </button>
                <p className="relative mt-4 text-xs text-slate-400">
                  <i className="fa-solid fa-shield-halved mr-1.5" />
                  Your session will be visible to your audience once you start.
                </p>
              </section>

              {/* Schedule Live glass card */}
              <section className="rounded-[30px] border border-white/80 bg-white/60 p-5 shadow-[0_25px_80px_rgba(51,65,85,0.09)] backdrop-blur-2xl sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50/80 text-indigo-600 shadow-sm">
                    <i className="fa-regular fa-calendar-days text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Schedule Live
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Plan your upcoming audience session
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Live Title
                    </label>
                    <input
                      type="text"
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      placeholder="Enter your live session title"
                      className="w-full rounded-xl border border-white/90 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/80"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      min={formatDateForInput(Date.now())}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-xl border border-white/90 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/80"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full rounded-xl border border-white/90 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/80"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={scheduleEndTime}
                        onChange={(e) => setScheduleEndTime(e.target.value)}
                        className="w-full rounded-xl border border-white/90 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/80"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={scheduling}
                    onClick={handleSchedule}
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.2)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                  >
                    <i className="fa-regular fa-calendar-check" />
                    {scheduling ? "Scheduling..." : "Schedule Live"}
                  </button>
                </div>
              </section>
            </div>

            {/* =================================================
          SCHEDULED LIVE STREAMS TABLE
      ================================================= */}

            <div className="mt-7 overflow-hidden rounded-3xl border border-white/70 bg-white/65 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-7">
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
                  className="mb-6 rounded-2xl border border-blue-200/70 bg-blue-50/60 p-5 backdrop-blur-xl"
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
                        className="w-full rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
                        className="w-full rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
                        className="w-full rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
                        className="w-full rounded-xl border border-white/80 bg-white/75 p-3 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 py-12 text-center">
                  <p className="text-gray-600 text-lg">
                    No scheduled live streams found.
                  </p>

                  <p className="text-gray-400 text-sm mt-2">
                    Schedule a new live session to see it here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0 text-left">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600">
                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          #
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          Live Title
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          Scheduled Date
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          Start Time
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          End Time
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          Channel Name
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap">
                          Status
                        </th>

                        <th className="border-b border-slate-200/80 px-4 py-3 whitespace-nowrap text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {scheduledLives.map((live, index) => (
                        <tr
                          key={live.id}
                          className="transition hover:bg-blue-50/50"
                        >
                          <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                            {index + 1}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">
                            {live.title || "Untitled Live"}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 whitespace-nowrap text-slate-500">
                            {formatScheduledDate(live.scheduledAt)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 whitespace-nowrap text-slate-500">
                            {formatScheduledTime(live.scheduledAt)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 whitespace-nowrap text-slate-500">
                            {formatScheduledTime(live.scheduledEndAt)}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                            {live.channelName || "-"}
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {live.status}
                            </span>
                          </td>

                          <td className="border-b border-slate-100 px-4 py-3">
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
        </main>
      )}

      {/* LIVE: replace the dashboard with a full-screen live studio */}
      {isLive && (
        <main className="fixed inset-0 z-[99990] overflow-y-auto bg-purple-200 p-3 text-white sm:p-5 lg:p-6">
          <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-col">
            <header className="mb-1 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-1">
              <div className="min-w-0">
                <h1 className="mt-1 text-purple-700 truncate text-lg font-semibold sm:text-xl">
                  {liveInfo?.title || title || "Live Session"}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleEndLive}
                disabled={ending}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <i className="fa-solid fa-phone-slash" />
                {ending ? "Ending Live..." : "End Live"}
              </button>
            </header>

            <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] overflow-hidden ">
              {/* Main broadcast + viewer PiP */}
              <section className="flex min-h-[55vh] flex-col overflow-hidden rounded-2xl  bg-[#11151d]">
                <div className="relative min-h-[55vh] flex-1 overflow-hidden bg-black">
                  <div
                    id="local-player"
                    className="absolute inset-0 h-full w-full overflow-hidden bg-black"
                  />

                  <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs font-bold backdrop-blur-md">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    LIVE{" "}
                    <span className="font-medium text-[10px] text-white/70">
                      {viewerCount} Viewers
                    </span>
                  </div>

                  {activeInteraction?.interactionType === "VIDEO" && (
                    <div className="absolute right-3 top-3 z-30 w-[125px] overflow-hidden rounded-xl border-2 border-white/70 bg-gray-900 shadow-2xl sm:right-5 sm:top-5 sm:w-[210px]">
                      <div className="flex items-center justify-between bg-black/80 px-2 py-1.5">
                        <span className="text-[10px] font-semibold sm:text-xs">
                          Viewer
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-green-400 sm:text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          {remoteVideoUid ? "Connected" : "Connecting"}
                        </span>
                      </div>
                      <div
                        id="interaction-viewer-container"
                        className="relative aspect-[3/4] w-full overflow-hidden bg-black"
                      >
                        {remoteVideoUid ? (
                          <div
                            id={`interaction-viewer-${remoteVideoUid}`}
                            className="h-full w-full"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-gray-400">
                            Waiting for viewer...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-black/75 p-2 shadow-xl backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={handleToggleMicrophone}
                      disabled={ending || !micTrackRef.current}
                      aria-label={
                        isMicMuted ? "Unmute microphone" : "Mute microphone"
                      }
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${isMicMuted ? "bg-red-600" : "bg-white/15 hover:bg-white/25"}`}
                    >
                      <i
                        className={`fa-solid ${isMicMuted ? "fa-microphone-slash" : "fa-microphone"}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      disabled={ending || !cameraTrackRef.current}
                      aria-label={
                        isCameraPaused ? "Resume video" : "Pause video"
                      }
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${isCameraPaused ? "bg-amber-500" : "bg-white/15 hover:bg-white/25"}`}
                    >
                      <i
                        className={`fa-solid ${isCameraPaused ? "fa-play" : "fa-video"}`}
                      />
                    </button>
                    <span className="mx-1 h-7 w-px bg-white/20" />
                    <button
                      type="button"
                      onClick={handleEndLive}
                      disabled={ending}
                      className="flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      <i className="fa-solid fa-phone-slash" /> End Live
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-white/10 bg-[#11151d] p-3 text-xs">
                  <span
                    className={`rounded-lg px-3 py-2 ${isMicMuted ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"}`}
                  >
                    <i
                      className={`fa-solid ${isMicMuted ? "fa-microphone-slash" : "fa-microphone"} mr-2`}
                    />
                    Microphone {isMicMuted ? "Muted" : "On"}
                  </span>
                  <span
                    className={`rounded-lg px-3 py-2 ${isCameraPaused ? "bg-amber-500/15 text-amber-300" : "bg-green-500/15 text-green-300"}`}
                  >
                    <i
                      className={`fa-solid ${isCameraPaused ? "fa-circle-pause" : "fa-video"} mr-2`}
                    />
                    Camera {isCameraPaused ? "Paused" : "On"}
                  </span>
                </div>
              </section>

              {/* Chat and audience requests */}
              <aside className="grid min-h-[620px] grid-rows-[minmax(320px,1fr)_auto] gap-4 xl:h-[calc(100vh-90px)] xl:min-h-0">
                <section className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11151ddd]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                    <div>
                      <h2 className="text-xs font-semibold">Live Chat</h2>
                     
                    </div>
                    <i className="fa-solid fa-comments text-white/50" />
                  </div>

                  <div
                    ref={messagesContainerRef}
                    className="min-h-0 flex-1 h-full space-y-3 overflow-y-auto p-4 scrollbar-hide"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-white/35">
                        <i className="fa-regular fa-message mb-3 text-2xl" />
                        <p className="text-sm">No messages yet</p>
                        <p className="mt-1 text-xs">
                          Audience messages will appear here
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                <div
  key={msg.id}
  className={`w-fit max-w-[90%] rounded-xl border px-3 py-1 ${
    msg.type === "gift"
      ? "border-amber-100 bg-amber-200"
      : "border-gray-100 bg-gradient-to-r from-purple-300 via-yellow-200 to-violet-300"
  } ${
    msg.sender?.toLowerCase().includes("astrologer")
      ? "ml-auto"
      : "mr-auto"
  }`}
>
  <p className="text-[10px] text-purple-600">
    {msg.sender
      ?.split("_")[0]
      ?.replace(/^./, (char) => char.toUpperCase())}
  </p>

  <p
    className={`break-words text-xs ${
      msg.type === "gift" ? "text-amber-700" : "text-black"
    }`}
  >
    {msg.type === "gift" && (
      <i className="fa-solid fa-gift mr-2" />
    )}
    {msg.text}
  </p>
</div>
                      ))
                    )}
                  </div>

                  <form
                    className="flex gap-2 border-t border-white/10 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendAstrologerMessage();
                    }}
                  >
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="min-w-0 flex-1 bg-white placeholder:text-gray-400 rounded-xl border border-white/10 px-3 py-3 text-sm text-black outline-none  focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-700"
                    >
                      <i className="fa-solid fa-paper-plane" />
                    </button>
                  </form>
                </section>

                <section className="max-h-[340px] overflow-y-auto rounded-2xl border border-white/10 bg-[#11151d] p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-semibold">Viewer Requests</h2>
                    {pendingInteractions.length > 0 && (
                      <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">
                        {pendingInteractions.length} New
                      </span>
                    )}
                  </div>
                  {pendingInteractions.length === 0 ? (
                    <p className="text-sm text-white/45">
                      No pending audio/video requests.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingInteractions.map((request) => (
                        <div
                          key={request.id}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold">
                                Viewer Request
                              </p>
                              <p className="mt-1 text-xs text-white/55">
                                {request.interactionType === "VIDEO"
                                  ? "📹 Video"
                                  : "🎤 Audio"}
                              </p>
                            </div>
                            <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300">
                              Pending
                            </span>
                          </div>
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleRespondInteraction(request, "ACCEPT")
                              }
                              disabled={
                                Boolean(interactionLoadingId) ||
                                Boolean(activeInteraction)
                              }
                              className="flex-1 rounded-full bg-green-600 py-1 text-xs font-semibold hover:bg-green-700 disabled:opacity-40"
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
                              className="flex-1 rounded-full bg-red-600 py-1 text-xs font-semibold hover:bg-red-700 disabled:opacity-40"
                            >
                              {interactionLoadingId === request.id
                                ? "Processing..."
                                : "Reject"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeInteraction && (
                    <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          Active{" "}
                          {activeInteraction.interactionType === "VIDEO"
                            ? "Video"
                            : "Audio"}{" "}
                          Interaction
                        </p>
                        <span className="text-[10px] text-green-300">
                          Accepted
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/55">
                        {remoteVideoUid || remoteAudioTrackRef.current
                          ? "Viewer media connected."
                          : "Waiting for viewer to connect..."}
                      </p>
                      <button
                        type="button"
                        onClick={handleEndInteraction}
                        disabled={Boolean(interactionLoadingId)}
                        className="mt-3 w-full rounded-lg bg-red-600 py-2 text-xs font-semibold hover:bg-red-700 disabled:opacity-40"
                      >
                        End Viewer Interaction
                      </button>
                    </div>
                  )}
                  {interactionNotice && (
                    <p className="mt-3 rounded-lg bg-blue-500/10 p-3 text-xs text-blue-200">
                      {interactionNotice}
                    </p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </main>
      )}

      {/* Start title modal */}
      {!isLive && showStartLiveModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!starting) setShowStartLiveModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <i className="fa-solid fa-tower-broadcast text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Start Your Live</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Set up your session before going live
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStartLiveModal(false)}
                disabled={starting}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-40"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Live Session Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim() && !starting) {
                  e.preventDefault();
                  handleStartLive();
                }
              }}
              placeholder="e.g. Live Astrology Consultation"
              disabled={starting || restoringLive}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 disabled:opacity-60"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>Give your audience a clear idea of the session.</span>
              <span>{title.length}/100</span>
            </div>
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <i className="fa-solid fa-circle-info mr-2 text-gray-400" />
              Make sure your camera and microphone are ready.
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowStartLiveModal(false)}
                disabled={starting}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartLive}
                disabled={
                  !title.trim() ||
                  starting ||
                  ending ||
                  restoringLive ||
                  recoveryRequired
                }
                className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch animate-spin" />
                    Starting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-play" />
                    Start Live
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
