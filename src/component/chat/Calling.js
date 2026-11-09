
"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, {
  useEffect,
  useState,
  useContext,
  useRef,
} from "react";
import {
  PhoneOff,
  Phone,
  Mic,
  MicOff,
  User,
} from "lucide-react";

import SocketContext from "../SocketClient";

// ========================================
// TURN CONFIGURATION
// ========================================



const Calling = () => {
  // ========================================
  // REFS
  // ========================================

const FORCE_RELAY = true;
const ICE_SERVERS = [
  {
    urls: "stun:162.214.102.56:3478",
  },
  {
    urls: [
      "turn:162.214.102.56:3478?transport=udp",
      "turn:162.214.102.56:3478?transport=tcp",
    ],
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  },
];

  const ringtoneRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const pendingIceCandidatesRef = useRef([]);

  const hasEndedRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const isUnmountingRef = useRef(false);

  const currentRequestRef = useRef(null);
  const activeCallKeyRef = useRef(null);

  // ========================================
  // STATE
  // ========================================

  const [callState, setCallState] = useState("idle");
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [callerName, setCallerName] = useState("Client");
  const [waveHeights, setWaveHeights] = useState(
    Array(20).fill(10)
  );

  const socket = useContext(SocketContext);

  // ========================================
  // ASTROLOGER DETAILS
  // ========================================

  const [astroId, setAstroId] = useState(null);

  useEffect(() => {
    try {
      const astro = JSON.parse(
        localStorage.getItem("astro_user") || "{}"
      );

      setAstroId(astro?.id || null);
    } catch (error) {
      console.error("Unable to read astrologer details:", error);
    }
  }, []);

  const activeCallKey = astroId
    ? `activeAstrologerCall_${astroId}`
    : null;

  useEffect(() => {
    activeCallKeyRef.current = activeCallKey;
  }, [activeCallKey]);

  // ========================================
  // HELPER: STOP RINGTONE
  // ========================================

  const stopRingtone = () => {
    const ringtone = ringtoneRef.current;

    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  };

  // ========================================
  // HELPER: CLEAR ICE QUEUE
  // ========================================

  const clearPendingCandidates = () => {
    pendingIceCandidatesRef.current = [];
  };

  // ========================================
  // HELPER: FLUSH ICE CANDIDATES
  // ========================================

  const flushPendingIceCandidates = async (pc) => {
    if (!pc?.remoteDescription) {
      return;
    }

    const candidates = [
      ...pendingIceCandidatesRef.current,
    ];

    pendingIceCandidatesRef.current = [];

    console.log(
      "📦 Processing queued ICE candidates:",
      candidates.length
    );

    for (const candidate of candidates) {
      try {
        if (pc.signalingState === "closed") {
          break;
        }

        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("✅ Queued ICE candidate added");
      } catch (error) {
        console.error(
          "❌ Failed to add queued ICE candidate:",
          error
        );
      }
    }
  };

  // ========================================
  // HELPER: ADD REMOTE ICE CANDIDATE
  // ========================================

  const addRemoteIceCandidate = async (candidate) => {
    try {
      if (!candidate) return;

      const pc = peerConnectionRef.current;

      // Peer connection may not exist yet.
      if (!pc) {
        pendingIceCandidatesRef.current.push(candidate);

        console.log(
          "⏳ ICE candidate queued: Peer connection not ready"
        );

        return;
      }

      // Remote description must be set first.
      if (!pc.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);

        console.log(
          "⏳ ICE candidate queued: Remote description not ready"
        );

        return;
      }

      await pc.addIceCandidate(
        new RTCIceCandidate(candidate)
      );

      console.log("✅ Remote ICE candidate added");
    } catch (error) {
      console.error(
        "❌ Error adding remote ICE candidate:",
        error
      );
    }
  };

  // ========================================
  // HELPER: MICROPHONE
  // ========================================

  const initMedia = async () => {
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

      console.log("🎤 Requesting microphone permission");

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
        "✅ Microphone initialized:",
        stream.getAudioTracks().length
      );

      return stream;
    } catch (error) {
      console.error("❌ Mic access failed:", error);
      return null;
    }
  };

  // ========================================
  // HELPER: CLEANUP CALL
  // ========================================

  const cleanupCall = () => {
    console.log("🧹 Cleaning up WebRTC call");

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onicecandidateerror = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;

      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    clearPendingCandidates();

    stopRingtone();

    setCallState("idle");
    setCallTime(0);
    setCurrentRequest(null);
    setIsMuted(false);

    currentRequestRef.current = null;
  };

  // ========================================
  // HELPER: GET SELECTED ICE PAIR
  // ========================================

  const checkSelectedCandidatePair = async () => {
    const pc = peerConnectionRef.current;

    if (!pc) return;

    try {
      const stats = await pc.getStats();

      stats.forEach((report) => {
        if (
          report.type === "candidate-pair" &&
          report.state === "succeeded" &&
          report.nominated
        ) {
          const localCandidate = stats.get(
            report.localCandidateId
          );

          const remoteCandidate = stats.get(
            report.remoteCandidateId
          );

          console.log("🎯 SELECTED ICE PAIR:", {
            localCandidateType:
              localCandidate?.candidateType,
            remoteCandidateType:
              remoteCandidate?.candidateType,
            localProtocol: localCandidate?.protocol,
            remoteProtocol: remoteCandidate?.protocol,
            state: report.state,
            nominated: report.nominated,
          });
        }
      });
    } catch (error) {
      console.error("Stats error:", error);
    }
  };

  // ========================================
  // CREATE PEER CONNECTION
  // ========================================

  const createPeerConnection = (roomId) => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    console.log("🔗 Creating peer connection:", roomId);

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceTransportPolicy: FORCE_RELAY
        ? "relay"
        : "all",
    });

    peerConnectionRef.current = pc;

    // ========================================
    // ADD LOCAL AUDIO TRACKS
    // ========================================

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);

        console.log(
          "➕ Added local audio track:",
          track.kind,
          track.readyState
        );
      });
    } else {
      console.warn(
        "⚠️ Local microphone stream not available"
      );
    }

    // ========================================
    // REMOTE TRACK
    // ========================================

    pc.ontrack = async (event) => {
      console.log("🎧 Remote audio track received");

      if (
        remoteAudioRef.current &&
        event.streams?.[0]
      ) {
        remoteAudioRef.current.srcObject =
          event.streams[0];

        try {
          await remoteAudioRef.current.play();
          console.log("🔊 Remote audio playback started");
        } catch (error) {
          console.error(
            "❌ Remote audio playback error:",
            error
          );
        }
      }

      // Do not set connected here.
      // Wait for ICE connection to succeed.
    };

    // ========================================
    // LOCAL ICE CANDIDATES
    // ========================================

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📤 LOCAL ICE CANDIDATE:", {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port,
        });

        if (socket?.connected) {
          socket.emit("ice-candidate", {
            room_id: roomId,
            candidate: event.candidate,
          });
        } else {
          console.error(
            "❌ Socket disconnected; ICE candidate not sent"
          );
        }
      } else {
        console.log("✅ ICE gathering completed");
      }
    };

    // ========================================
    // ICE CANDIDATE ERRORS
    // ========================================

    pc.onicecandidateerror = (event) => {
      console.error("❌ ICE CANDIDATE ERROR:", {
        address: event.address,
        port: event.port,
        url: event.url,
        errorCode: event.errorCode,
        errorText: event.errorText,
      });
    };

    // ========================================
    // ICE CONNECTION STATE
    // ========================================

    pc.oniceconnectionstatechange = () => {
      console.log(
        "🧊 ICE State (Astrologer):",
        pc.iceConnectionState
      );

      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        console.log("✅ ICE connection established");
      }

      if (pc.iceConnectionState === "failed") {
        console.error("❌ ICE connection failed");
      }

      if (pc.iceConnectionState === "disconnected") {
        console.warn("⚠️ ICE connection disconnected");
      }
    };

    // ========================================
    // PEER CONNECTION STATE
    // ========================================

    pc.onconnectionstatechange = () => {
      console.log(
        "🔥 Peer Connection State (Astrologer):",
        pc.connectionState
      );

      if (pc.connectionState === "connected") {
        console.log("🎉 WebRTC call connected");

        setCallState("connected");

        checkSelectedCandidatePair();
      }

      if (pc.connectionState === "failed") {
        console.error("❌ WebRTC connection failed");

        setCallState("connecting");
      }

      if (pc.connectionState === "disconnected") {
        console.warn("⚠️ WebRTC disconnected");
      }
    };

    return pc;
  };

  // ========================================
  // RESTORE CALL AFTER REFRESH
  // ========================================

  const reconnectCall = async (roomId) => {
    if (!roomId || !socket) return;

    console.log("🔄 Reconnecting call:", roomId);

    const stream = await initMedia();

    if (!stream) {
      console.error(
        "❌ Unable to restore microphone"
      );

      return;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    clearPendingCandidates();

    setCallState("connecting");

    socket.emit("join_call", {
      roomId,
    });

    console.log("✅ Rejoined call room");
  };

  // ========================================
  // LOAD SAVED ACTIVE CALL
  // ========================================

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !socket ||
      !astroId ||
      !activeCallKey
    ) {
      return;
    }

    console.log("🔑 Active call key:", activeCallKey);

    const savedCall = localStorage.getItem(activeCallKey);

    console.log("💾 Saved call:", savedCall);

    if (!savedCall) {
      console.log("❌ No active call found");
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
        call.callTime - elapsedSeconds,
        0
      );

      if (remainingTime <= 0) {
        localStorage.removeItem(activeCallKey);
        return;
      }

      const restoredRequest = {
        room_id: call.roomId,
        userName: call.callerName,
        callTime: remainingTime,
      };

      currentRequestRef.current = restoredRequest;

      setCurrentRequest(restoredRequest);
      setCallerName(call.callerName || "Client");
      setCallTime(remainingTime);

      hasEndedRef.current = false;
      isCallActiveRef.current = true;
      isUnmountingRef.current = false;

      console.log("🔄 Restoring active call:", {
        roomId: call.roomId,
        remainingTime,
      });

      reconnectCall(call.roomId);
    } catch (error) {
      console.error(
        "❌ Failed to restore active call:",
        error
      );

      localStorage.removeItem(activeCallKey);
    }
  }, [socket, astroId, activeCallKey]);

  // ========================================
  // SOCKET EVENTS
  // ========================================

  useEffect(() => {
    if (!socket || !astroId) return;

    console.log("🎧 Registering astrologer socket listeners");

    // ========================================
    // INCOMING CALL
    // ========================================

    const handleIncomingCall = (data) => {
      if (data.receiverId !== astroId) return;

      console.log("📞 Incoming call:", data);

      hasEndedRef.current = false;
      isCallActiveRef.current = false;
      isUnmountingRef.current = false;

      currentRequestRef.current = data;

      setCurrentRequest(data);
      setCallerName(data.userName || "Client");
      setCallState("ringing");
      setCallTime(Number(data.callTime || 0) * 60);

      clearPendingCandidates();

      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;

        ringtoneRef.current.play().catch((error) => {
          console.warn(
            "🔇 Ringtone play failed:",
            error.message
          );
        });
      }
    };

    // ========================================
    // OFFER RECEIVED
    // ========================================

    const handleOffer = async (data) => {
      try {
        if (
          data.room_id !==
          currentRequestRef.current?.room_id
        ) {
          console.warn("⚠️ Offer room ID mismatch");
          return;
        }

        console.log("📨 Offer received");

        // Make sure microphone is ready before creating PC.
        const stream = await initMedia();

        if (!stream) {
          throw new Error("Microphone unavailable");
        }

        const pc = createPeerConnection(data.room_id);

        await pc.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        console.log("✅ Remote offer description set");

        // Process candidates received before the offer.
        await flushPendingIceCandidates(pc);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          room_id: data.room_id,
          answer: pc.localDescription,
        });

        console.log("✅ Answer sent to caller");
      } catch (error) {
        console.error("❌ Offer handling error:", error);
      }
    };

    // ========================================
    // REMOTE ICE CANDIDATE
    // ========================================

    const handleIceCandidate = async (data) => {
      if (
        data?.room_id !==
        currentRequestRef.current?.room_id
      ) {
        return;
      }

      await addRemoteIceCandidate(data.candidate);
    };

    // ========================================
    // CALL ENDED BY USER
    // ========================================

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
          console.log("📴 Call ended by user");

          hasEndedRef.current = true;
          isCallActiveRef.current = false;

          if (activeCallKeyRef.current) {
            localStorage.removeItem(
              activeCallKeyRef.current
            );
          }

          cleanupCall();
        }
      } catch (error) {
        console.error(
          "Call ended event error:",
          error
        );
      }
    };

    // ========================================
    // CALL CANCELLED BY USER
    // ========================================

    const handleCallCancelledByUser = (data) => {
      try {
        const parsedData =
          typeof data === "string"
            ? JSON.parse(data)
            : data;

        if (
          parsedData?.roomId ===
          currentRequestRef.current?.room_id
        ) {
          console.log("📴 Call cancelled by user");

          hasEndedRef.current = true;
          isCallActiveRef.current = false;

          if (activeCallKeyRef.current) {
            localStorage.removeItem(
              activeCallKeyRef.current
            );
          }

          cleanupCall();
        }
      } catch (error) {
        console.error(
          "Call cancel event error:",
          error
        );
      }
    };

    // ========================================
    // AUTO REJECT
    // ========================================

    const handleCallRejectAuto = () => {
      console.log("📴 Call automatically rejected");

      hasEndedRef.current = true;
      isCallActiveRef.current = false;

      if (activeCallKeyRef.current) {
        localStorage.removeItem(
          activeCallKeyRef.current
        );
      }

      cleanupCall();
    };

    // Register listeners.
    socket.on("incoming_call", handleIncomingCall);
    socket.on("offer", handleOffer);
    socket.on("ice-candidate", handleIceCandidate);

    socket.on(
      "call_ended_by_user",
      handleCallEndedByUser
    );

    socket.on(
      "call_cancel_by_user",
      handleCallCancelledByUser
    );

    socket.on(
      "call_reject_auto",
      handleCallRejectAuto
    );

    // ========================================
    // CLEANUP LISTENERS
    // ========================================

    return () => {
      console.log("🧹 Removing socket listeners");

      socket.off("incoming_call", handleIncomingCall);
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
        handleCallCancelledByUser
      );

      socket.off(
        "call_reject_auto",
        handleCallRejectAuto
      );
    };
  }, [socket, astroId]);

  // ========================================
  // ACCEPT CALL
  // ========================================

  const handleAccept = async () => {
    const roomId =
      currentRequestRef.current?.room_id;

    if (!roomId || !socket || !astroId) {
      console.error(
        "❌ Missing roomId, socket or astrologer ID"
      );

      return;
    }

    try {
      hasEndedRef.current = false;
      isUnmountingRef.current = false;
      isCallActiveRef.current = true;

      // Make sure microphone is initialized first.
      const stream = await initMedia();

      if (!stream) {
        throw new Error("Unable to access microphone");
      }

      const duration = callTime;

      const activeCall = {
        roomId,
        astroId,
        callerName:
          currentRequestRef.current?.userName || "Client",
        callTime: duration,
        startedAt: Date.now(),
        status: "active",
      };

      localStorage.setItem(
        activeCallKey,
        JSON.stringify(activeCall)
      );

      stopRingtone();

      clearPendingCandidates();

      socket.emit("join_call", {
        roomId,
      });

      setCallState("connecting");

      console.log("📞 Astrologer accepted call");

      setTimeout(() => {
        if (
          isUnmountingRef.current ||
          !isCallActiveRef.current
        ) {
          return;
        }

        socket.emit("callAcceptedByAstrologer", {
          roomId,
          astroId,
          callTime: duration,
        });

        console.log("✅ Call accepted event emitted");
      }, 400);
    } catch (error) {
      console.error("❌ Accept call error:", error);

      isCallActiveRef.current = false;

      setCallState("ringing");
    }
  };

  // ========================================
  // MUTE / UNMUTE
  // ========================================

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const track =
      localStreamRef.current.getAudioTracks()[0];

    if (track) {
      track.enabled = !track.enabled;

      setIsMuted(!track.enabled);

      console.log(
        track.enabled ? "🎤 Microphone unmuted" : "🔇 Microphone muted"
      );
    }
  };

  // ========================================
  // END CALL
  // ========================================

  const handleEndCall = () => {
    if (isUnmountingRef.current) {
      console.log("🚫 Component unmounting");
      return;
    }

    if (!isCallActiveRef.current) {
      console.log("🚫 No active call");
      return;
    }

    if (hasEndedRef.current) {
      console.log("🚫 Call already ended");
      return;
    }

    const roomId =
      currentRequestRef.current?.room_id;

    if (!roomId || !astroId) {
      console.log("🚫 Missing roomId / astroId");
      return;
    }

    hasEndedRef.current = true;
    isCallActiveRef.current = false;

    if (activeCallKey) {
      localStorage.removeItem(activeCallKey);
    }

    socket?.emit("call_ended_by_astrologer", {
      roomId,
      astroId,
    });

    console.log("📴 Call ended by astrologer");

    cleanupCall();
  };

  // ========================================
  // CANCEL CALL
  // ========================================

  const callCancel = () => {
    const roomId =
      currentRequestRef.current?.room_id;

    if (!roomId || !socket) return;

    hasEndedRef.current = true;
    isCallActiveRef.current = false;

    if (activeCallKey) {
      localStorage.removeItem(activeCallKey);
    }

    stopRingtone();

    socket.emit("call_cancel_by_astrologer", {
      roomId,
      astroId,
    });

    cleanupCall();
  };

  // ========================================
  // CALL TIMER
  // ========================================

  useEffect(() => {
    if (callState !== "connected") return;

    if (callTime <= 0) {
      if (
        isCallActiveRef.current &&
        !hasEndedRef.current &&
        !isUnmountingRef.current
      ) {
        console.log("⏰ Call time expired");
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

  // ========================================
  // VOICE WAVE ANIMATION
  // ========================================

  useEffect(() => {
    if (callState !== "connected") return;

    if (!remoteAudioRef.current?.srcObject) return;

    const audioContext = new AudioContext();

    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 64;

    const source = audioContext.createMediaStreamSource(
      remoteAudioRef.current.srcObject
    );

    source.connect(analyser);

    const dataArray = new Uint8Array(
      analyser.frequencyBinCount
    );

    let animationFrameId;

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      const normalized = Array.from(dataArray)
        .slice(0, 20)
        .map((value) => Math.max(10, value / 2));

      setWaveHeights(normalized);

      animationFrameId =
        requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      source.disconnect();
      audioContext.close();
    };
  }, [callState]);

  // ========================================
  // COMPONENT UNMOUNT
  // ========================================

  useEffect(() => {
    console.log("📞 CALLING COMPONENT MOUNTED");

    return () => {
      console.log("❌ CALLING COMPONENT UNMOUNTED");

      isUnmountingRef.current = true;
      isCallActiveRef.current = false;

      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onicecandidateerror = null;
        peerConnectionRef.current.close();

        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        localStreamRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      }

      clearPendingCandidates();

      ringtoneRef.current?.pause();
    };
  }, []);

  // ========================================
  // TIME FORMAT
  // ========================================

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // ========================================
  // UI
  // ========================================

  return (
    <>
      <audio
        ref={ringtoneRef}
        src="/sounds/sound2.mp3"
        preload="auto"
        loop
      />

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
      />

      <AnimatePresence mode="wait">

        {/* ================================== */}
        {/* RINGING SCREEN */}
        {/* ================================== */}

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
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                }}
                className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-7xl font-bold shadow-2xl"
              >
                {callerName[0]}
              </motion.div>

              <h1 className="text-4xl font-semibold text-white mt-10">
                Incoming Call
              </h1>

              <p className="text-2xl text-purple-300 mt-4">
                {callerName}
              </p>

              <div className="flex justify-center gap-12 mt-16">

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

        {/* ================================== */}
        {/* CONNECTING SCREEN */}
        {/* ================================== */}

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
          </motion.div>
        )}

        {/* ================================== */}
        {/* CONNECTED SCREEN */}
        {/* ================================== */}

        {callState === "connected" && (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-950 via-purple-950 to-black flex flex-col items-center justify-center text-white"
          >
            <div className="md:w-3/5 overflow-hidden w-full shadow-lg rounded-3xl flex flex-col md:h-[95vh] h-[100vh]">

              <div className="flex flex-col w-full rounded-3xl shadow-xl items-center justify-between py-10 h-full bg-gray-900 text-white">

                <div className="flex flex-col items-center">

                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
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

                <div className="mt-12 flex items-center gap-3 text-xl font-mono">
                  Time Left: {formatTime(callTime)}
                </div>

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

                <div className="flex gap-8">

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
