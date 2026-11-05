"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";

import {
  PhoneOff,
  Phone,
  Mic,
  MicOff,
  User,
} from "lucide-react";

import SocketContext from "../SocketClient";

const Calling = () => {
  const socket = useContext(SocketContext);

  // =====================================================
  // REFS
  // =====================================================

  const ringtoneRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const pendingIceCandidatesRef = useRef([]);

  const hasEndedRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const isUnmountingRef = useRef(false);

  const currentRequestRef = useRef(null);
  const socketRef = useRef(socket);

  const statsIntervalRef = useRef(null);

  const processingOfferRef = useRef(false);
  const lastOfferSdpRef = useRef(null);

  // =====================================================
  // STATES
  // =====================================================

  const [callState, setCallState] = useState("idle");
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [callerName, setCallerName] = useState("Client");

  const [waveHeights, setWaveHeights] = useState(
    Array(20).fill(10)
  );

  const [remoteAudioStream, setRemoteAudioStream] =
    useState(null);

  const [needsAudioGesture, setNeedsAudioGesture] =
    useState(false);

  const [astroId, setAstroId] = useState(null);

  // =====================================================
  // SOCKET REF
  // =====================================================

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // =====================================================
  // ASTROLOGER ID
  // =====================================================

  useEffect(() => {
    try {
      const astro = JSON.parse(
        localStorage.getItem("astro_user") || "{}"
      );

      if (astro?.id) {
        setAstroId(astro.id);
      }
    } catch (error) {
      console.error(
        "[ASTRO] Failed to read astrologer from localStorage:",
        error
      );
    }
  }, []);

  const activeCallKey = astroId
    ? `activeAstrologerCall_${astroId}`
    : null;

  // =====================================================
  // CURRENT REQUEST REF
  // =====================================================

  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);

  // =====================================================
  // STOP RINGTONE
  // =====================================================

  const stopRingtone = useCallback(() => {
    const ringtone = ringtoneRef.current;

    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  }, []);

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);

    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;

    return `${mins
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // =====================================================
  // INITIALIZE MICROPHONE
  // =====================================================

  const initMedia = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        const existingTracks =
          localStreamRef.current.getAudioTracks();

        const hasLiveTrack = existingTracks.some(
          (track) => track.readyState === "live"
        );

        if (hasLiveTrack) {
          return localStreamRef.current;
        }

        localStreamRef.current = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser does not support microphone access"
        );
      }

      console.log(
        "[ASTRO][MEDIA] Requesting microphone access"
      );

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      localStreamRef.current = stream;

      console.log(
        "[ASTRO][MEDIA] Microphone initialized:",
        {
          audioTracks: stream.getAudioTracks().length,
          tracks: stream.getAudioTracks().map((track) => ({
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label,
          })),
        }
      );

      return stream;
    } catch (error) {
      console.error(
        "[ASTRO][MEDIA] Microphone access failed:",
        error
      );

      return null;
    }
  }, []);

  // =====================================================
  // CLEANUP STATS
  // =====================================================

  const stopStatsMonitoring = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  }, []);

  // =====================================================
  // CLEANUP CALL
  // =====================================================

  const cleanupCall = useCallback(() => {
    console.log("[ASTRO][CALL] Cleaning up call");

    stopStatsMonitoring();
    stopRingtone();

    setCallState("idle");
    setCallTime(0);
    setCurrentRequest(null);
    setIsMuted(false);
    setRemoteAudioStream(null);
    setNeedsAudioGesture(false);
    setWaveHeights(Array(20).fill(10));

    currentRequestRef.current = null;

    processingOfferRef.current = false;
    lastOfferSdpRef.current = null;

    // Close peer connection.

    if (peerConnectionRef.current) {
      const pc = peerConnectionRef.current;

      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onicecandidateerror = null;
      pc.oniceconnectionstatechange = null;
      pc.onconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.onicegatheringstatechange = null;

      pc.close();

      peerConnectionRef.current = null;
    }

    // Clear ICE queue.

    pendingIceCandidatesRef.current = [];

    console.log(
      "[ASTRO][ICE] PeerConnection closed and ICE queue cleared"
    );

    // Stop microphone.

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    }

    // Stop remote audio.

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    console.log("[ASTRO][CALL] Cleanup completed");
  }, [stopRingtone, stopStatsMonitoring]);

  // =====================================================
  // ENABLE REMOTE AUDIO AFTER USER GESTURE
  // =====================================================

  const enableRemoteAudio = useCallback(async () => {
    try {
      if (!remoteAudioRef.current) {
        return;
      }

      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;

      if (remoteAudioStream) {
        remoteAudioRef.current.srcObject =
          remoteAudioStream;
      }

      await remoteAudioRef.current.play();

      setNeedsAudioGesture(false);

      console.log(
        "[ASTRO][AUDIO] Remote audio enabled by user gesture"
      );
    } catch (error) {
      console.error(
        "[ASTRO][AUDIO] Unable to enable remote audio:",
        error
      );

      setNeedsAudioGesture(true);
    }
  }, [remoteAudioStream]);

  // =====================================================
  // SELECTED ICE CANDIDATE PAIR / AUDIO STATS
  // =====================================================

  const logPeerStats = useCallback(async (pc) => {
    if (!pc || pc.connectionState === "closed") {
      return;
    }

    try {
      const stats = await pc.getStats();

      let selectedPair = null;
      let transportSelectedPairId = null;

      const localCandidates = new Map();
      const remoteCandidates = new Map();

      stats.forEach((report) => {
        if (report.type === "local-candidate") {
          localCandidates.set(report.id, report);
        }

        if (report.type === "remote-candidate") {
          remoteCandidates.set(report.id, report);
        }

        if (report.type === "transport") {
          transportSelectedPairId =
            report.selectedCandidatePairId || null;
        }

        if (
          report.type === "candidate-pair" &&
          (report.selected || report.nominated)
        ) {
          selectedPair = report;
        }

        // Incoming audio statistics.

        if (
          report.type === "inbound-rtp" &&
          (report.kind === "audio" ||
            report.mediaType === "audio")
        ) {
          console.log("[ASTRO][STATS] Inbound audio:", {
            packetsReceived: report.packetsReceived,
            packetsLost: report.packetsLost,
            bytesReceived: report.bytesReceived,
            jitter: report.jitter,
          });
        }

        // Outgoing audio statistics.

        if (
          report.type === "outbound-rtp" &&
          (report.kind === "audio" ||
            report.mediaType === "audio")
        ) {
          console.log("[ASTRO][STATS] Outbound audio:", {
            packetsSent: report.packetsSent,
            bytesSent: report.bytesSent,
          });
        }
      });

      if (transportSelectedPairId) {
        selectedPair =
          stats.get(transportSelectedPairId) ||
          selectedPair;
      }

      if (selectedPair) {
        const localCandidate = localCandidates.get(
          selectedPair.localCandidateId
        );

        const remoteCandidate = remoteCandidates.get(
          selectedPair.remoteCandidateId
        );

        console.log(
          "[ASTRO][ICE] Selected candidate pair:",
          {
            state: selectedPair.state,
            nominated: selectedPair.nominated,
            selected: selectedPair.selected,

            localCandidateType:
              localCandidate?.candidateType,

            localProtocol: localCandidate?.protocol,

            remoteCandidateType:
              remoteCandidate?.candidateType,

            remoteProtocol: remoteCandidate?.protocol,

            currentRoundTripTime:
              selectedPair.currentRoundTripTime,

            availableOutgoingBitrate:
              selectedPair.availableOutgoingBitrate,
          }
        );
      } else {
        console.warn(
          "[ASTRO][ICE] No selected candidate pair yet"
        );
      }
    } catch (error) {
      console.error(
        "[ASTRO][STATS] Failed to read peer statistics:",
        error
      );
    }
  }, []);

  // =====================================================
  // START STATS MONITORING
  // =====================================================

  const startStatsMonitoring = useCallback(
    (pc) => {
      stopStatsMonitoring();

      statsIntervalRef.current = setInterval(() => {
        logPeerStats(pc);
      }, 5000);
    },
    [logPeerStats, stopStatsMonitoring]
  );

  // =====================================================
  // BUILD ICE SERVER CONFIGURATION
  // METERED TURN + GOOGLE STUN FALLBACK
  // =====================================================

  const getIceServers = useCallback(async () => {
    const fallbackIceServers = [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
    ];

    try {
      console.log(
        "[ASTRO][ICE] Fetching Metered TURN credentials..."
      );

      const response = await fetch(
        "/api/turn-credentials",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `TURN API returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      if (
        !result?.success ||
        !Array.isArray(result.iceServers) ||
        result.iceServers.length === 0
      ) {
        throw new Error(
          result?.message ||
            "Invalid Metered TURN credentials response"
        );
      }

      // Keep Google STUN and add Metered ICE servers.

      const iceServers = [
        ...fallbackIceServers,
        ...result.iceServers,
      ];

      console.log(
        "[ASTRO][ICE] Metered ICE servers loaded successfully:",
        {
          count: result.iceServers.length,
          servers: result.iceServers.map((server) => ({
            urls: server.urls,
            hasUsername: Boolean(server.username),
            hasCredential: Boolean(server.credential),
          })),
        }
      );

      return iceServers;
    } catch (error) {
      console.error(
        "[ASTRO][ICE] Failed to load Metered TURN credentials. Falling back to Google STUN:",
        error
      );

      return fallbackIceServers;
    }
  }, []);

  // =====================================================
  // CREATE PEER CONNECTION
  // =====================================================

  const createPeerConnection = useCallback(
    async (roomId) => {
      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      // IMPORTANT:
      // Wait for Metered credentials before creating PC.

      const iceServers = await getIceServers();

      // Another call might have created the PC while
      // the TURN credentials were being fetched.

      if (peerConnectionRef.current) {
        return peerConnectionRef.current;
      }

      const iceConfig = {
        iceServers,

        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",

        // Normal production setting.
        // For a temporary TURN test, change to "relay"
        // on BOTH user and astrologer clients.
        iceTransportPolicy: "all",
      };

      const pc = new RTCPeerConnection(iceConfig);

      peerConnectionRef.current = pc;

      console.log(
        "[ASTRO][RTC] PeerConnection created:",
        {
          roomId,
          iceServers: iceServers.map(
            (server) => server.urls
          ),
          iceTransportPolicy:
            iceConfig.iceTransportPolicy,
          pendingCandidates:
            pendingIceCandidatesRef.current.length,
        }
      );

      // =================================================
      // ADD LOCAL AUDIO TRACKS
      // =================================================

      if (localStreamRef.current) {
        localStreamRef.current
          .getAudioTracks()
          .forEach((track) => {
            pc.addTrack(track, localStreamRef.current);

            console.log(
              "[ASTRO][RTC] Local audio track added:",
              {
                enabled: track.enabled,
                muted: track.muted,
                readyState: track.readyState,
              }
            );
          });
      }

      // =================================================
      // REMOTE AUDIO TRACK
      // =================================================

      pc.ontrack = async (event) => {
        console.log(
          "[ASTRO][RTC] Remote track received:",
          {
            kind: event.track.kind,
            readyState: event.track.readyState,
            muted: event.track.muted,
            streams: event.streams.length,
          }
        );

        let stream = event.streams?.[0];

        if (!stream) {
          stream = new MediaStream([event.track]);
        }

        setRemoteAudioStream(stream);

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1;

          try {
            await remoteAudioRef.current.play();

            setNeedsAudioGesture(false);

            console.log(
              "[ASTRO][AUDIO] Remote audio playback started"
            );
          } catch (error) {
            console.warn(
              "[ASTRO][AUDIO] Remote audio autoplay blocked:",
              error
            );

            setNeedsAudioGesture(true);
          }
        }

        event.track.onunmute = () => {
          console.log(
            "[ASTRO][AUDIO] Remote audio track is now unmuted"
          );
        };

        event.track.onmute = () => {
          console.warn(
            "[ASTRO][AUDIO] Remote audio track became muted"
          );
        };

        event.track.onended = () => {
          console.warn(
            "[ASTRO][AUDIO] Remote audio track ended"
          );
        };
      };

      // =================================================
      // SEND ICE CANDIDATES
      // =================================================

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateJSON =
            event.candidate.toJSON();

          const candidateString =
            candidateJSON.candidate || "";

          const candidateType =
            candidateString.match(
              /\btyp\s+(\w+)/
            )?.[1] || "unknown";

          const protocol =
            candidateString.match(
              /\b(udp|tcp)\b/i
            )?.[1] || "unknown";

          console.log(
            "[ASTRO][ICE] Sending candidate:",
            {
              candidateType,
              protocol,
              candidate: candidateString,
            }
          );

          socketRef.current?.emit("ice-candidate", {
            room_id: roomId,
            candidate: candidateJSON,
          });
        } else {
          console.log(
            "[ASTRO][ICE] ICE candidate gathering completed"
          );
        }
      };

      // =================================================
      // ICE CANDIDATE ERRORS
      // =================================================

      pc.onicecandidateerror = (event) => {
        console.error(
          "[ASTRO][ICE] Candidate error:",
          {
            url: event.url,
            errorCode: event.errorCode,
            errorText: event.errorText,
            address: event.address,
            port: event.port,
          }
        );
      };

      // =================================================
      // ICE CONNECTION STATE
      // =================================================

      pc.oniceconnectionstatechange = () => {
        console.log(
          "[ASTRO][RTC] iceConnectionState:",
          pc.iceConnectionState
        );

        if (
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        ) {
          if (
            !hasEndedRef.current &&
            isCallActiveRef.current
          ) {
            setCallState("connected");
            startStatsMonitoring(pc);
          }
        }

        if (pc.iceConnectionState === "failed") {
          console.error(
            "[ASTRO][RTC] ICE connection failed"
          );

          stopStatsMonitoring();
        }

        if (pc.iceConnectionState === "disconnected") {
          console.warn(
            "[ASTRO][RTC] ICE disconnected; waiting for recovery"
          );
        }

        if (pc.iceConnectionState === "closed") {
          stopStatsMonitoring();
        }
      };

      // =================================================
      // PEER CONNECTION STATE
      // =================================================

      pc.onconnectionstatechange = () => {
        console.log(
          "[ASTRO][RTC] connectionState:",
          pc.connectionState
        );

        if (pc.connectionState === "connected") {
          console.log(
            "[ASTRO][RTC] Peer connection established"
          );
        }

        if (pc.connectionState === "failed") {
          console.error(
            "[ASTRO][RTC] Peer connection failed"
          );
        }

        if (pc.connectionState === "disconnected") {
          console.warn(
            "[ASTRO][RTC] Peer connection disconnected"
          );
        }
      };

      // =================================================
      // SIGNALING STATE
      // =================================================

      pc.onsignalingstatechange = () => {
        console.log(
          "[ASTRO][RTC] signalingState:",
          pc.signalingState
        );
      };

      // =================================================
      // ICE GATHERING STATE
      // =================================================

      pc.onicegatheringstatechange = () => {
        console.log(
          "[ASTRO][RTC] iceGatheringState:",
          pc.iceGatheringState
        );
      };

      return pc;
    },
    [
      getIceServers,
      startStatsMonitoring,
      stopStatsMonitoring,
    ]
  );

  // =====================================================
  // ADD REMOTE ICE CANDIDATE
  // =====================================================

  const addRemoteIceCandidate = useCallback(
    async (pc, candidate) => {
      if (!pc || !candidate) {
        return;
      }

      try {
        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        const candidateString =
          candidate.candidate || "";

        const candidateType =
          candidateString.match(
            /\btyp\s+(\w+)/
          )?.[1] || "unknown";

        const protocol =
          candidateString.match(
            /\b(udp|tcp)\b/i
          )?.[1] || "unknown";

        console.log(
          "[ASTRO][ICE] Remote candidate added successfully:",
          {
            candidateType,
            protocol,
          }
        );
      } catch (error) {
        console.error(
          "[ASTRO][ICE] Failed to add remote candidate:",
          error,
          candidate
        );
      }
    },
    []
  );

  // =====================================================
  // DRAIN PENDING ICE CANDIDATES
  // =====================================================

  const drainPendingIceCandidates = useCallback(
    async (pc) => {
      if (!pc?.remoteDescription) {
        console.warn(
          "[ASTRO][ICE] Cannot drain candidates: remote description missing"
        );

        return;
      }

      const queuedCandidates =
        pendingIceCandidatesRef.current.splice(0);

      console.log(
        "[ASTRO][ICE] Draining queued candidates:",
        queuedCandidates.length
      );

      for (const candidate of queuedCandidates) {
        if (pc !== peerConnectionRef.current) {
          console.warn(
            "[ASTRO][ICE] PeerConnection changed; stopping candidate drain"
          );

          return;
        }

        await addRemoteIceCandidate(pc, candidate);
      }

      console.log(
        "[ASTRO][ICE] Candidate queue drained"
      );
    },
    [addRemoteIceCandidate]
  );

  // =====================================================
  // RECONNECT ACTIVE CALL AFTER REFRESH
  // =====================================================

  const reconnectCall = useCallback(
    async (roomId) => {
      if (!roomId || !socketRef.current) {
        return;
      }

      console.log(
        "[ASTRO][CALL] Reconnecting active call:",
        roomId
      );

      const stream = await initMedia();

      if (!stream) {
        console.error(
          "[ASTRO][CALL] Unable to restore microphone"
        );

        return;
      }

      // Close any stale peer connection.

      if (peerConnectionRef.current) {
        const oldPc = peerConnectionRef.current;

        oldPc.ontrack = null;
        oldPc.onicecandidate = null;
        oldPc.onicecandidateerror = null;
        oldPc.oniceconnectionstatechange = null;
        oldPc.onconnectionstatechange = null;
        oldPc.onsignalingstatechange = null;
        oldPc.onicegatheringstatechange = null;

        oldPc.close();

        peerConnectionRef.current = null;
      }

      pendingIceCandidatesRef.current = [];
      processingOfferRef.current = false;
      lastOfferSdpRef.current = null;

      setRemoteAudioStream(null);
      setNeedsAudioGesture(false);

      setCallState("connecting");

      socketRef.current.emit("join_call", {
        roomId,
      });

      console.log(
        "[ASTRO][CALL] Rejoined call room:",
        roomId
      );
    },
    [initMedia]
  );

  // =====================================================
  // SOCKET EVENTS
  // =====================================================

  useEffect(() => {
    if (!socket || !astroId) {
      return;
    }

    socketRef.current = socket;

    // Initialize microphone in advance.

    initMedia();

    // =================================================
    // INCOMING CALL
    // =================================================

    const handleIncomingCall = (data) => {
      if (data?.receiverId !== astroId) {
        return;
      }

      if (
        isCallActiveRef.current &&
        !hasEndedRef.current
      ) {
        console.warn(
          "[ASTRO][CALL] Already handling an active call. Ignoring incoming call."
        );

        return;
      }

      console.log(
        "[ASTRO][CALL] Incoming call:",
        data
      );

      hasEndedRef.current = false;
      isCallActiveRef.current = false;
      isUnmountingRef.current = false;

      pendingIceCandidatesRef.current = [];
      processingOfferRef.current = false;
      lastOfferSdpRef.current = null;

      currentRequestRef.current = data;

      setCurrentRequest(data);

      setCallerName(data.userName || "Client");

      setCallState("ringing");

      setCallTime(
        Math.max(0, Number(data.callTime) || 0) * 60
      );

      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;

        ringtoneRef.current.play().catch((error) => {
          console.warn(
            "[ASTRO][CALL] Ringtone playback failed:",
            error.message
          );
        });
      }
    };

    // =================================================
    // OFFER
    // =================================================

    const handleOffer = async (data) => {
      const roomId = data?.room_id;
      const offer = data?.offer;

      try {
        if (
          roomId !==
          currentRequestRef.current?.room_id
        ) {
          console.warn(
            "[ASTRO][SDP] Ignoring offer for another room:",
            {
              receivedRoomId: roomId,
              currentRoomId:
                currentRequestRef.current?.room_id,
            }
          );

          return;
        }

        if (!offer) {
          console.error(
            "[ASTRO][SDP] Offer is missing"
          );

          return;
        }

        if (processingOfferRef.current) {
          console.warn(
            "[ASTRO][SDP] Another offer is already being processed"
          );

          return;
        }

        if (
          lastOfferSdpRef.current &&
          lastOfferSdpRef.current === offer.sdp
        ) {
          console.warn(
            "[ASTRO][SDP] Duplicate offer ignored"
          );

          return;
        }

        processingOfferRef.current = true;

        console.log(
          "[ASTRO][SDP] Processing offer:",
          roomId
        );

        // Microphone must be ready before creating PC.

        const stream = await initMedia();

        if (!stream) {
          throw new Error(
            "Cannot process offer without microphone"
          );
        }

        // IMPORTANT:
        // Wait for Metered TURN credentials before
        // creating the RTCPeerConnection.

        const pc = await createPeerConnection(roomId);

        console.log(
          "[ASTRO][SDP] Received offer:",
          {
            roomId,
            offerType: offer.type,
            signalingStateBefore: pc.signalingState,
          }
        );

        if (pc.remoteDescription?.type === "offer") {
          console.warn(
            "[ASTRO][SDP] Remote offer already applied"
          );

          return;
        }

        // Apply remote offer first.

        await pc.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        console.log(
          "[ASTRO][SDP] Remote offer applied:",
          {
            signalingState: pc.signalingState,
            remoteDescriptionType:
              pc.remoteDescription?.type,
            queuedCandidates:
              pendingIceCandidatesRef.current.length,
          }
        );

        // Add queued ICE candidates.

        await drainPendingIceCandidates(pc);

        // Create and apply local answer.

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        console.log(
          "[ASTRO][SDP] Local answer created:",
          {
            roomId,
            signalingState: pc.signalingState,
            sdpType: pc.localDescription?.type,
          }
        );

        // Emit the answer to the user.

        socketRef.current?.emit("answer", {
          room_id: roomId,
          answer: pc.localDescription,
        });

        lastOfferSdpRef.current = offer.sdp;

        console.log(
          "[ASTRO][SDP] Answer emitted successfully"
        );
      } catch (error) {
        lastOfferSdpRef.current = null;

        console.error(
          "[ASTRO][SDP] Offer processing failed:",
          error
        );
      } finally {
        processingOfferRef.current = false;
      }
    };

    // =================================================
    // INCOMING ICE CANDIDATE
    // =================================================

    const handleIceCandidate = async (data) => {
      try {
        if (
          data?.room_id !==
          currentRequestRef.current?.room_id
        ) {
          console.warn(
            "[ASTRO][ICE] Ignoring candidate for another room:",
            {
              receivedRoomId: data?.room_id,
              currentRoomId:
                currentRequestRef.current?.room_id,
            }
          );

          return;
        }

        if (!data?.candidate) {
          console.warn(
            "[ASTRO][ICE] Empty candidate received"
          );

          return;
        }

        const pc = peerConnectionRef.current;

        // Queue candidates until remote offer is applied.

        if (!pc || !pc.remoteDescription) {
          pendingIceCandidatesRef.current.push(
            data.candidate
          );

          const candidateString =
            data.candidate.candidate || "";

          const candidateType =
            candidateString.match(
              /\btyp\s+(\w+)/
            )?.[1] || "unknown";

          const protocol =
            candidateString.match(
              /\b(udp|tcp)\b/i
            )?.[1] || "unknown";

          console.log(
            "[ASTRO][ICE] Candidate queued:",
            {
              peerConnectionReady: Boolean(pc),
              remoteDescriptionReady: Boolean(
                pc?.remoteDescription
              ),
              queueLength:
                pendingIceCandidatesRef.current.length,
              candidateType,
              protocol,
            }
          );

          return;
        }

        await addRemoteIceCandidate(
          pc,
          data.candidate
        );
      } catch (error) {
        console.error(
          "[ASTRO][ICE] Failed to process remote candidate:",
          error,
          data?.candidate
        );
      }
    };

    // =================================================
    // CALL ENDED BY USER
    // =================================================

    const handleCallEndedByUser = (data) => {
      try {
        const parsedData =
          typeof data === "string"
            ? JSON.parse(data)
            : data;

        if (
          parsedData?.room_id ===
          currentRequestRef.current?.room_id
        ) {
          console.log(
            "[ASTRO][CALL] User ended the call"
          );

          hasEndedRef.current = true;
          isCallActiveRef.current = false;

          if (activeCallKey) {
            localStorage.removeItem(activeCallKey);
          }

          cleanupCall();
        }
      } catch (error) {
        console.error(
          "[ASTRO][CALL] call_ended_by_user error:",
          error
        );
      }
    };

    // =================================================
    // CALL CANCELLED BY USER
    // =================================================

    const handleCallCancelByUser = (data) => {
      try {
        const parsedData =
          typeof data === "string"
            ? JSON.parse(data)
            : data;

        if (
          parsedData?.roomId ===
          currentRequestRef.current?.room_id
        ) {
          console.log(
            "[ASTRO][CALL] User cancelled the call"
          );

          hasEndedRef.current = true;
          isCallActiveRef.current = false;

          if (activeCallKey) {
            localStorage.removeItem(activeCallKey);
          }

          cleanupCall();
        }
      } catch (error) {
        console.error(
          "[ASTRO][CALL] call_cancel_by_user error:",
          error
        );
      }
    };

    // =================================================
    // AUTO REJECT
    // =================================================

    const handleCallRejectAuto = () => {
      console.log(
        "[ASTRO][CALL] Call automatically rejected"
      );

      hasEndedRef.current = true;
      isCallActiveRef.current = false;

      if (activeCallKey) {
        localStorage.removeItem(activeCallKey);
      }

      cleanupCall();
    };

    // =================================================
    // REGISTER SOCKET EVENTS
    // =================================================

    socket.on("incoming_call", handleIncomingCall);

    socket.on("offer", handleOffer);

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    socket.on(
      "call_ended_by_user",
      handleCallEndedByUser
    );

    socket.on(
      "call_cancel_by_user",
      handleCallCancelByUser
    );

    socket.on(
      "call_reject_auto",
      handleCallRejectAuto
    );

    // =================================================
    // REMOVE EXACT SOCKET LISTENERS
    // =================================================

    return () => {
      socket.off(
        "incoming_call",
        handleIncomingCall
      );

      socket.off("offer", handleOffer);

      socket.off(
        "ice-candidate",
        handleIceCandidate
      );

      socket.off(
        "call_ended_by_user",
        handleCallEndedByUser
      );

      socket.off(
        "call_cancel_by_user",
        handleCallCancelByUser
      );

      socket.off(
        "call_reject_auto",
        handleCallRejectAuto
      );
    };
  }, [
    socket,
    astroId,
    activeCallKey,
    initMedia,
    createPeerConnection,
    drainPendingIceCandidates,
    addRemoteIceCandidate,
    cleanupCall,
  ]);

  // =====================================================
  // RESTORE ACTIVE CALL FROM LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    if (!socket || !astroId || !activeCallKey) {
      return;
    }

    console.log(
      "[ASTRO][CALL] Checking saved active call:",
      activeCallKey
    );

    const savedCall =
      localStorage.getItem(activeCallKey);

    if (!savedCall) {
      console.log(
        "[ASTRO][CALL] No saved active call found"
      );

      return;
    }

    try {
      const call = JSON.parse(savedCall);

      if (
        !call?.roomId ||
        call.status !== "active" ||
        call.astroId !== astroId
      ) {
        localStorage.removeItem(activeCallKey);
        return;
      }

      const elapsedSeconds = Math.floor(
        (Date.now() - call.startedAt) / 1000
      );

      const remainingTime = Math.max(
        Number(call.callTime || 0) - elapsedSeconds,
        0
      );

      if (remainingTime <= 0) {
        console.log(
          "[ASTRO][CALL] Saved call has expired"
        );

        localStorage.removeItem(activeCallKey);
        return;
      }

      const restoredRequest = {
        room_id: call.roomId,
        userName: call.callerName || "Client",
        callTime: remainingTime,
      };

      currentRequestRef.current = restoredRequest;

      setCurrentRequest(restoredRequest);

      setCallerName(call.callerName || "Client");

      setCallTime(remainingTime);

      hasEndedRef.current = false;
      isCallActiveRef.current = true;
      isUnmountingRef.current = false;

      console.log(
        "[ASTRO][CALL] Restoring active call:",
        {
          roomId: call.roomId,
          remainingTime,
        }
      );

      reconnectCall(call.roomId);
    } catch (error) {
      console.error(
        "[ASTRO][CALL] Failed to restore call:",
        error
      );

      localStorage.removeItem(activeCallKey);
    }
  }, [
    socket,
    astroId,
    activeCallKey,
    reconnectCall,
  ]);

  // =====================================================
  // ACCEPT CALL
  // =====================================================

  const handleAccept = async () => {
    const roomId =
      currentRequestRef.current?.room_id;

    if (!roomId || !socket || !astroId) {
      console.error(
        "[ASTRO][CALL] Cannot accept: missing roomId/socket/astroId"
      );

      return;
    }

    try {
      console.log(
        "[ASTRO][CALL] Accepting call:",
        roomId
      );

      const stream = await initMedia();

      if (!stream) {
        console.error(
          "[ASTRO][CALL] Cannot accept without microphone"
        );

        return;
      }

      hasEndedRef.current = false;
      isUnmountingRef.current = false;
      isCallActiveRef.current = true;

      pendingIceCandidatesRef.current = [];
      processingOfferRef.current = false;
      lastOfferSdpRef.current = null;

      const duration = callTime;

      const activeCall = {
        roomId,
        astroId,

        callerName:
          currentRequestRef.current?.userName ||
          "Client",

        callTime: duration,

        startedAt: Date.now(),

        status: "active",
      };

      if (activeCallKey) {
        localStorage.setItem(
          activeCallKey,
          JSON.stringify(activeCall)
        );
      }

      stopRingtone();

      // Join socket room.

      socket.emit("join_call", {
        roomId,
      });

      console.log(
        "[ASTRO][CALL] Joined socket room:",
        roomId
      );

      setCallState("connecting");

      // Notify caller after joining.

      setTimeout(() => {
        if (
          isUnmountingRef.current ||
          !isCallActiveRef.current ||
          hasEndedRef.current
        ) {
          return;
        }

        socketRef.current?.emit(
          "callAcceptedByAstrologer",
          {
            roomId,
            astroId,
            callTime: duration,
          }
        );

        console.log(
          "[ASTRO][CALL] Acceptance event emitted"
        );
      }, 400);
    } catch (error) {
      console.error(
        "[ASTRO][CALL] Accept call failed:",
        error
      );
    }
  };

  // =====================================================
  // TOGGLE MUTE
  // =====================================================

  const toggleMute = () => {
    if (!localStreamRef.current) {
      return;
    }

    const track =
      localStreamRef.current.getAudioTracks()[0];

    if (!track) {
      return;
    }

    track.enabled = !track.enabled;

    setIsMuted(!track.enabled);

    console.log(
      "[ASTRO][MEDIA] Microphone:",
      track.enabled ? "Unmuted" : "Muted"
    );
  };

  // =====================================================
  // END CALL
  // =====================================================

  const handleEndCall = () => {
    if (isUnmountingRef.current) {
      console.log(
        "[ASTRO][CALL] Component is unmounting"
      );

      return;
    }

    if (!isCallActiveRef.current) {
      console.log(
        "[ASTRO][CALL] No active call"
      );

      return;
    }

    if (hasEndedRef.current) {
      console.log(
        "[ASTRO][CALL] Call already ended"
      );

      return;
    }

    const roomId =
      currentRequestRef.current?.room_id;

    if (!roomId || !astroId) {
      console.log(
        "[ASTRO][CALL] Missing roomId or astroId"
      );

      return;
    }

    console.log(
      "[ASTRO][CALL] Ending call:",
      roomId
    );

    hasEndedRef.current = true;
    isCallActiveRef.current = false;

    if (activeCallKey) {
      localStorage.removeItem(activeCallKey);
    }

    socketRef.current?.emit(
      "call_ended_by_astrologer",
      {
        roomId,
        astroId,
      }
    );

    cleanupCall();
  };

  // =====================================================
  // CANCEL INCOMING CALL
  // =====================================================

  const callCancel = () => {
    const roomId =
      currentRequestRef.current?.room_id;

    if (!roomId || !socket || !astroId) {
      return;
    }

    console.log(
      "[ASTRO][CALL] Rejecting incoming call:",
      roomId
    );

    hasEndedRef.current = true;
    isCallActiveRef.current = false;

    if (activeCallKey) {
      localStorage.removeItem(activeCallKey);
    }

    stopRingtone();

    socket.emit(
      "call_cancel_by_astrologer",
      {
        roomId,
        astroId,
      }
    );

    cleanupCall();
  };

  // =====================================================
  // CALL TIMER
  // =====================================================

  useEffect(() => {
    if (callState !== "connected") {
      return;
    }

    if (callTime <= 0) {
      if (
        isCallActiveRef.current &&
        !hasEndedRef.current &&
        !isUnmountingRef.current
      ) {
        console.log(
          "[ASTRO][CALL] Call time expired"
        );

        handleEndCall();
      }

      return;
    }

    const interval = setInterval(() => {
      setCallTime((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, callTime]);

  // =====================================================
  // REMOTE AUDIO WAVEFORM
  // =====================================================

  useEffect(() => {
    if (
      callState !== "connected" ||
      !remoteAudioStream
    ) {
      setWaveHeights(Array(20).fill(10));
      return;
    }

    let audioContext;
    let source;
    let animationFrameId;

    try {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn(
          "[ASTRO][AUDIO] AudioContext not supported"
        );

        return;
      }

      audioContext = new AudioContextClass();

      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 64;

      source =
        audioContext.createMediaStreamSource(
          remoteAudioStream
        );

      source.connect(analyser);

      const dataArray = new Uint8Array(
        analyser.frequencyBinCount
      );

      const animate = () => {
        analyser.getByteFrequencyData(dataArray);

        const normalized = Array.from(dataArray)
          .slice(0, 20)
          .map((value) =>
            Math.max(10, value / 2)
          );

        setWaveHeights(normalized);

        animationFrameId =
          requestAnimationFrame(animate);
      };

      animate();

      if (audioContext.state === "suspended") {
        audioContext.resume().catch((error) => {
          console.warn(
            "[ASTRO][AUDIO] AudioContext resume failed:",
            error
          );
        });
      }
    } catch (error) {
      console.error(
        "[ASTRO][AUDIO] Waveform initialization failed:",
        error
      );
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (source) {
        try {
          source.disconnect();
        } catch (error) {
          console.warn(error);
        }
      }

      if (audioContext) {
        audioContext.close().catch(() => {});
      }
    };
  }, [callState, remoteAudioStream]);

  // =====================================================
  // COMPONENT UNMOUNT
  // =====================================================

  useEffect(() => {
    console.log(
      "[ASTRO] CALLING COMPONENT MOUNTED"
    );

    return () => {
      console.log(
        "[ASTRO] CALLING COMPONENT UNMOUNTED"
      );

      // Do not emit call_ended_by_astrologer here.
      // Refreshing or navigating away should not end
      // the server-side call automatically.

      isUnmountingRef.current = true;
      isCallActiveRef.current = false;

      stopStatsMonitoring();
      stopRingtone();

      if (peerConnectionRef.current) {
        const pc = peerConnectionRef.current;

        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onicecandidateerror = null;
        pc.oniceconnectionstatechange = null;
        pc.onconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.onicegatheringstatechange = null;

        pc.close();

        peerConnectionRef.current = null;
      }

      pendingIceCandidatesRef.current = [];
      processingOfferRef.current = false;

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }

      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
      }
    };
  }, [stopStatsMonitoring, stopRingtone]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* Ringtone */}

      <audio
        ref={ringtoneRef}
        src="/sounds/sound2.mp3"
        preload="auto"
        loop
      />

      {/* Remote Audio */}

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
      />

      <AnimatePresence mode="wait">
        {/* ========================================= */}
        {/* RINGING SCREEN */}
        {/* ========================================= */}

        {callState === "ringing" && (
          <motion.div
            key="ringing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 gap-12 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                }}
                className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-7xl font-bold shadow-2xl"
              >
                {callerName?.[0]?.toUpperCase() || "C"}
              </motion.div>

              <h1 className="text-4xl font-semibold text-white mt-10">
                Incoming Call
              </h1>

              <p className="text-2xl text-purple-300 mt-4">
                {callerName}
              </p>

              <div className="flex justify-center gap-12 mt-16">
                {/* Reject */}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={callCancel}
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700"
                >
                  <PhoneOff
                    size={42}
                    className="text-white"
                  />
                </motion.button>

                {/* Accept */}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAccept}
                  className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700"
                >
                  <Phone
                    size={42}
                    className="text-white"
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================= */}
        {/* CONNECTING SCREEN */}
        {/* ========================================= */}

        {callState === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] gap-12 bg-gradient-to-br from-gray-950 to-black flex flex-col items-center justify-center text-white"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6">
              <User size={60} />
            </div>

            <h2 className="text-3xl font-medium">
              Connecting...
            </h2>

            <p className="text-gray-400 mt-3">
              Please wait
            </p>

            {needsAudioGesture && (
              <button
                type="button"
                onClick={enableRemoteAudio}
                className="mt-6 rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700"
              >
                Tap to enable audio
              </button>
            )}
          </motion.div>
        )}

        {/* ========================================= */}
        {/* CONNECTED CALL SCREEN */}
        {/* ========================================= */}

        {callState === "connected" && (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-950 via-purple-950 to-black flex flex-col items-center justify-center text-white"
          >
            <div className="md:w-3/5 overflow-hidden w-full shadow-lg rounded-3xl flex flex-col md:h-[95vh] h-[100vh]">
              <div className="flex flex-col w-full rounded-3xl shadow-xl items-center justify-between py-10 h-full bg-gray-900 text-white">
                {/* Caller Information */}

                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                    }}
                    className="px-4 py-2 rounded-full bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-500 flex items-center justify-center text-2xl font-bold shadow-2xl border-4 border-white/30"
                  >
                    {callerName}
                  </motion.div>

                  <div className="flex items-center gap-2 mt-4 text-green-400">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    Connected
                  </div>
                </div>

                {/* Call Timer */}

                <div className="mt-12 flex items-center gap-3 text-xl font-mono">
                  Time Left: {formatTime(callTime)}
                </div>

                {/* Voice Waveform */}

                <div className="flex items-end justify-center gap-1 h-20 mt-4">
                  {waveHeights.map((height, index) => (
                    <div
                      key={index}
                      className="w-2 bg-green-400 rounded-full transition-all duration-75"
                      style={{
                        height: `${height}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Autoplay fallback */}

                {needsAudioGesture && (
                  <button
                    type="button"
                    onClick={enableRemoteAudio}
                    className="rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700"
                  >
                    Tap to enable audio
                  </button>
                )}

                {/* Call Controls */}

                <div className="flex gap-8">
                  {/* Mute */}

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={toggleMute}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all ${
                      isMuted
                        ? "bg-yellow-500 text-black"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </motion.button>

                  {/* End Call */}

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={handleEndCall}
                    className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-2xl"
                  >
                    <PhoneOff size={42} />
                  </motion.button>
                </div>

                <p className="absolute bottom-6 text-xs text-gray-500">
                  This call may be recorded for quality purposes
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Calling;