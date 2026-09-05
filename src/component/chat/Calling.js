"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useContext, useRef } from "react";
import { PhoneOff, Phone, Mic, MicOff, Clock, User } from "lucide-react";
import SocketContext from "../SocketClient";

const Calling = () => {
  useEffect(() => {
    console.log("📞 CALLING COMPONENT MOUNTED");

    return () => {
      console.log("❌ CALLING COMPONENT UNMOUNTED");
    };
  }, []);
  const socket = useContext(SocketContext);

  // Refs
  const ringtoneRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const stopRingtone = () => {
    const ringtone = ringtoneRef.current;

    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }
  };
  // States
  const [callState, setCallState] = useState("idle");
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [callerName, setCallerName] = useState("Client");
  const hasEndedRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const currentRequestRef = useRef(null);
  const [waveHeights, setWaveHeights] = useState(Array(20).fill(10));
  // const remoteAudio = useRef(null);
  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);
  // voice waves
  // voice waves
  useEffect(() => {
    if (callState !== "connected") return;
    if (!remoteAudioRef.current?.srcObject) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 64;

    const source = audioContext.createMediaStreamSource(
      remoteAudioRef.current.srcObject,
    );

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let animationFrameId;

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);

      const normalized = Array.from(dataArray)
        .slice(0, 20)
        .map((v) => Math.max(10, v / 2));

      setWaveHeights(normalized);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      audioContext.close();
    };
  }, [callState]);

  const astroId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("astro_user") || "{}")?.id
      : null;
  const activeCallKey = astroId ? `activeAstrologerCall_${astroId}` : null;
  // ====================== CALL TIMER ======================
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
      setCallTime((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, callTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ====================== INITIALIZE MIC ======================
  const initMedia = async () => {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      return stream;
    } catch (err) {
      console.error("❌ Mic access failed:", err);
      return null;
    }
  };

  const reconnectCall = async (roomId) => {
    if (!roomId || !socket) return;

    const stream = await initMedia();

    if (!stream) {
      console.error("❌ Unable to restore microphone");
      return;
    }

    // Make sure previous connection doesn't exist
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    socket.emit("join_call", {
      roomId,
    });

    setCallState("connecting");

    console.log("🔄 Rejoining call:", roomId);
  };

  // ====================== CREATE PEER CONNECTION ======================
  const createPeerConnection = (roomId) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const iceConfig = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(iceConfig);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
        console.log("➕ Added local audio track");
      });
    }

    pc.ontrack = async (event) => {
      console.log("🎧 Remote track received (Astrologer)");
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        try {
          await remoteAudioRef.current.play();
        } catch (e) {
          console.error("Autoplay blocked", e);
        }
      }
      setCallState("connected");
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          room_id: roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE State (Astro):", pc.iceConnectionState);
    };
    pc.onconnectionstatechange = () => {
      console.log("🔥 Connection State (Astro):", pc.connectionState);
    };

    return pc;
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!socket) return;
    if (!activeCallKey) return;

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

      const elapsedSeconds = Math.floor((Date.now() - call.startedAt) / 1000);

      const remainingTime = Math.max(call.callTime - elapsedSeconds, 0);

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
      setCallerName(call.callerName);
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
      console.error("❌ Failed to restore active call:", error);
      localStorage.removeItem(activeCallKey);
    }
  }, [socket, astroId, activeCallKey]);
  // ====================== SOCKET EVENTS ======================
  useEffect(() => {
    if (!socket) return;
    initMedia();

    socket.on("incoming_call", (data) => {
      if (data.receiverId !== astroId) return;

      console.log("📞 Incoming call:", data);

      hasEndedRef.current = false;
      isCallActiveRef.current = false;
      isUnmountingRef.current = false;

      currentRequestRef.current = data;

      setCurrentRequest(data);
      setCallerName(data.userName || "Client");
      setCallState("ringing");
      setCallTime(data.callTime * 60 || 0);

      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;

        ringtoneRef.current.play().catch((err) => {
          console.warn("🔇 Call ringtone play failed:", err.message);
        });
      }
    });

    socket.on("offer", async (data) => {
      try {
        if (data.room_id !== currentRequestRef.current?.room_id) {
          return;
        }

        const pc = createPeerConnection(data.room_id);

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          room_id: data.room_id,
          answer,
        });
      } catch (err) {
        console.error("❌ Offer Error:", err);
      }
    });

    socket.on("ice-candidate", async (data) => {
      try {
        if (data?.room_id !== currentRequestRef.current?.room_id) {
          return;
        }

        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        }
      } catch (err) {
        console.error("❌ ICE Error:", err);
      }
    });

    socket.on("call_ended_by_user", (data) => {
      try {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;

        if (parsedData?.room_id === currentRequestRef.current?.room_id) {
          hasEndedRef.current = true;
          isCallActiveRef.current = false;
          stopRingtone();
          localStorage.removeItem(activeCallKey);
          cleanupCall();
        }
      } catch (error) {
        console.error("call_ended_by_user parse error:", error);
      }
    });

    socket.on("call_cancel_by_user", (data) => {
      try {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;

        if (parsedData?.roomId === currentRequestRef.current?.room_id) {
          hasEndedRef.current = true;
          isCallActiveRef.current = false;
          stopRingtone();
          localStorage.removeItem(activeCallKey);

          cleanupCall();
        }
      } catch (error) {
        console.error("call_cancel_by_user parse error:", error);
      }
    });

    socket.on("call_reject_auto", () => {
      hasEndedRef.current = true;
      isCallActiveRef.current = false;
      stopRingtone();
      localStorage.removeItem(activeCallKey);

      cleanupCall();
    });

    return () => {
      socket.off("incoming_call");
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("call_ended_by_user");
      socket.off("call_cancel_by_user");
      socket.off("call_reject_auto");
    };
  }, [socket, astroId]);

  // ====================== HANDLERS ======================
  const handleAccept = async () => {
    const roomId = currentRequestRef.current?.room_id;

    if (!roomId || !socket || !astroId) return;

    hasEndedRef.current = false;
    isUnmountingRef.current = false;
    isCallActiveRef.current = true;

    const duration = callTime;

    const activeCall = {
      roomId,
      astroId,
      callerName: currentRequestRef.current?.userName || "Client",
      callTime: duration,
      startedAt: Date.now(),
      status: "active",
    };

    localStorage.setItem(activeCallKey, JSON.stringify(activeCall));

    stopRingtone();

    socket.emit("join_call", { roomId });

    setTimeout(() => {
      if (isUnmountingRef.current || !isCallActiveRef.current) {
        return;
      }

      socket.emit("callAcceptedByAstrologer", {
        roomId,
        astroId,
        callTime: duration,
      });

      setCallState("connecting");
    }, 400);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  const handleEndCall = () => {
    if (isUnmountingRef.current) {
      console.log("🚫 Component unmounting - no end event");
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

    const roomId = currentRequestRef.current?.room_id;

    if (!roomId || !astroId) {
      console.log("🚫 Missing roomId / astroId");
      return;
    }

    hasEndedRef.current = true;
    isCallActiveRef.current = false;

    // Remove persisted call
    localStorage.removeItem(activeCallKey);

    socket?.emit("call_ended_by_astrologer", {
      roomId,
      astroId,
    });

    cleanupCall();
  };

  const cleanupCall = () => {
    setCallState("idle");
    setCallTime(0);
    setCurrentRequest(null);
    setIsMuted(false);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    ringtoneRef.current?.pause();
    stopRingtone();
  };

  const callCancel = () => {
    const roomId = currentRequestRef.current?.room_id;

    if (!roomId || !socket) return;

    hasEndedRef.current = true;
    isCallActiveRef.current = false;

    localStorage.removeItem(activeCallKey);
    stopRingtone();
    cleanupCall();

    socket.emit("call_cancel_by_astrologer", {
      roomId,
      astroId,
    });
  };
  useEffect(() => {
    return () => {
      console.log("🔄 Calling component unmounted");

      // VERY IMPORTANT:
      // Never emit call_ended_by_astrologer here
      isUnmountingRef.current = true;
      isCallActiveRef.current = false;

      // Stop WebRTC
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop microphone
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        localStreamRef.current = null;
      }

      // Stop remote audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      // Stop ringtone
      ringtoneRef.current?.pause();
    };
  }, []);
  return (
    <>
      <audio ref={ringtoneRef} src="/sounds/sound2.mp3" preload="auto" loop />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <AnimatePresence mode="wait">
        {/* Ringing Screen */}
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
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-7xl font-bold shadow-2xl"
              >
                {callerName[0]}
              </motion.div>

              <h1 className="text-4xl font-semibold text-white mt-10">
                Incoming Call
              </h1>
              <p className="text-2xl text-purple-300 mt-4">{callerName}</p>

              <div className="flex justify-center gap-12 mt-16">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={callCancel}
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700"
                >
                  <PhoneOff size={42} className="text-white" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAccept}
                  className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700"
                >
                  <Phone size={42} className="text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Connecting Screen */}
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
            <h2 className="text-3xl font-medium">Connecting...</h2>
            <p className="text-gray-400 mt-3">Please wait</p>
          </motion.div>
        )}

        {/* Connected Call Screen */}
        {callState === "connected" && (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100]  bg-gradient-to-br from-gray-950 via-purple-950 to-black flex flex-col items-center justify-center text-white"
          >
            <div className="md:w-3/5 overflow-hidden w-full shadow-lg rounded-3xl  flex flex-col md:h-[95vh] h-[100vh]">
              <div className="flex flex-col w-full  rounded-3xl shadow-xl items-center justify-between py-10    h-full bg-gray-900 text-white">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    {/* <img
                      src="/ds-img/a.jpg"
                      alt={astroData?.astrologer?.name}
                      width={50}
                      height={50}
                      className="rounded-full object-cover"
                    /> */}

                    {/* <h2 className="text-xl">{astroData?.astrologer?.name}</h2> */}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="px-4 py-2 rounded-full bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-500 flex items-center justify-center text-2xl font-bold shadow-2xl border-4 border-white/30"
                  >
                    {callerName}
                  </motion.div>

                  {/* <h2 className="text-4xl font-semibold mt-8">{callerName}</h2> */}
                  <div className="flex items-center gap-2 mt-4 text-green-400">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    Connected
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-3 text-xl font-mono">
                  Time Left : {""}
                  {formatTime(callTime)}
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

                <div className=" flex gap-8">
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
