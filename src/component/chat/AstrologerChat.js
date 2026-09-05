import { useState, useEffect, useRef, useContext, useCallback } from "react";
import imageCompression from "browser-image-compression";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import SocketContext from "@/component/SocketClient";
import { useRouter, useSearchParams } from "next/navigation";
import { decryptParams } from "@/app/utils/crypto";
import "@/component/chat/astro.css";
import PopUp from "@/app/common/PopUp";
import { motion, AnimatePresence } from "framer-motion";
import { FaUpload } from "react-icons/fa";
import { BiCheckDouble } from "react-icons/bi";
import { GiAstrolabe } from "react-icons/gi";
import { IoIosAttach } from "react-icons/io";
import { useGetChatBySessionIdQuery } from "@/app/redux/slice/chatHistoryApi";
import TimerController from "@/component/chat/TimerController";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { SENDER_IMG_URL, RECEIVER_IMG_URL } from "@/app/redux/apiConfig";

const GET_SESSION_MESSAGES = gql`
  query getCurrentChatMessages($roomId: String!) {
    getCurrentChatMessages(roomId: $roomId) {
      success
      totalCount
      data {
        id
        msgId
        roomId
        senderId
        receiverId
        message
        image
        sender
        replyTo
        createdAt
      }
    }
  }
`;

export const GET_REMEDY_FOR_CHAT = gql`
  query GetRemediesForChat {
    getRemediesForChat {
      success
      message
      data {
        id
        title
        description
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPLOAD_FILE = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      success
      url
      filename
    }
  }
`;
const AstrologerChat = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState("");
  const [typingStatus, setTypingStatus] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const typingTimeoutRef = useRef(null);
  const [recharge, setRecharge] = useState(false);
  const [token, setToken] = useState("");
  const [endAlert, setEndAlert] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const socket = useContext(SocketContext);
  const searchParams = useSearchParams();
  const messageEndRef = useRef(null);
  const [chatend, setChatEnd] = useState(false);
  // New state for canned messages
  const [cannedMessages, setCannedMessages] = useState([]);
  const [remedy, setRemedy] = useState([]);
  const [showCannedDropdown, setShowCannedDropdown] = useState(false);
  const [showRemedyDropdown, setShowRemedyDropdown] = useState(false);
  const [uploadFile, { loading: uploading }] = useMutation(UPLOAD_FILE);

  // Decrypt chat params
  const encryptedData = searchParams.get("data");
  let chatParams = {};
  if (encryptedData) {
    chatParams = decryptParams(encryptedData) || {};
  }
  const userName = chatParams.userName;
  const roomId = chatParams.roomId;
  const chat_time = chatParams?.chattime;
  const userId = chatParams.userId;
  const locationplace = chatParams.place;
  const bdate = chatParams.bod;
  const gender = chatParams.gender;
  const btime = chatParams.time;
  const occupation_user = chatParams.occupationuser;
  const userimage = chatParams.userimage;
  const latitude = chatParams.lat;
  const longitude = chatParams.lon;

  const { data, loading, error } = useQuery(GET_SESSION_MESSAGES, {
    variables: {
      roomId,
    },
    skip: !roomId,
    fetchPolicy: "network-only",
  });


  // GraphQL query for remedies
  const {
    data: remedyData,
    loading: remedyLoading,
    error: remedyError,
  } = useQuery(GET_REMEDY_FOR_CHAT, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (remedyData?.getRemediesForChat?.data) {
      setRemedy(remedyData.getRemediesForChat.data);
    }
  }, [remedyData]);

  useEffect(() => {
    const fetchCannedMessages = async () => {
      try {
        const data = [
          {
            id: 1,
            title: "introduction",
            description:
              "Hello! I am Astrologer, How can I assist you with your astrological needs?",
          },
          // --- Astrology Greetings ---
          {
            id: 4,
            title: "greeting",
            description:
              "Namaste! Thank you for reaching out. How may I assist you with your astrological queries today?",
          },
          {
            id: 5,
            title: "welcome message",
            description:
              "Welcome to my astrology consultation. Please share your date of birth, birthtime, and place of birth for accurate predictions.",
          },
          // --- Horoscope-related ---
          {
            id: 6,
            title: "daily horoscope",
            description:
              "Based on your zodiac sign, today brings opportunities for growth. Stay focused and positive.",
          },
          {
            id: 7,
            title: "weekly horoscope",
            description:
              "This week may bring challenges in your career but new opportunities in relationships. Trust the process.",
          },
          // --- Love & Relationship ---
          {
            id: 8,
            title: "love consultation",
            description:
              "Love and relationships are guided by Venus. Please provide partner details for compatibility analysis.",
          },
          {
            id: 9,
            title: "marriage prediction",
            description:
              "Marriage prospects look promising in the upcoming year. Would you like a detailed kundli match analysis?",
          },
          // --- Career & Finance ---
          {
            id: 10,
            title: "career guidance",
            description:
              "Your horoscope indicates strong potential in business ventures. Be cautious with investments this month.",
          },
          {
            id: 11,
            title: "financial forecast",
            description:
              "Financial stability will improve in the coming months. Plan your savings wisely.",
          },
          // --- Closing messages ---
          {
            id: 12,
            title: "thank you",
            description:
              "Thank you for consulting with me. May the stars always guide you towards happiness and success.",
          },
          {
            id: 13,
            title: "follow up",
            description:
              "I will share a detailed report shortly. Please stay connected for further guidance.",
          },
          // General Astrology
          {
            id: 14,
            title: "zodiac traits",
            description:
              "Each zodiac sign has unique strengths and weaknesses. Please share your sign for a detailed personality reading.",
          },
          {
            id: 15,
            title: "planetary effects",
            description:
              "Planetary movements like Mercury retrograde may influence your current situation. Would you like me to explain how?",
          },
          {
            id: 16,
            title: "remedies suggestion",
            description:
              "Astrological remedies like mantras, gemstones, or rituals can help balance planetary effects. Do you want tailored suggestions?",
          },
          // Health & Wellness
          {
            id: 17,
            title: "health forecast",
            description:
              "Your horoscope indicates the need for focus on health. Regular exercise and meditation are highly recommended this period.",
          },
          {
            id: 18,
            title: "mental wellbeing",
            description:
              "The moon's position suggests emotional sensitivity. Practicing mindfulness will help you stay calm.",
          },
          // Spiritual Guidance
          {
            id: 19,
            title: "karma insight",
            description:
              "Astrology also highlights your karmic path. Would you like to know more about your past life influences?",
          },
          {
            id: 20,
            title: "meditation guidance",
            description:
              "Meditation aligned with your moon sign can bring peace and clarity. Shall I suggest a practice?",
          },
          {
            id: 21,
            title: "lucky numbers",
            description:
              "Your lucky numbers today are 3, 7, and 21. Keep them in mind for important decisions.",
          },
          // Vastu / Home-related
          {
            id: 22,
            title: "vastu tips",
            description:
              "Vastu principles suggest aligning your home/office with cosmic energy for prosperity. Would you like some tips?",
          },
          {
            id: 23,
            title: "property decision",
            description:
              "Planetary alignments indicate this may be a good period to consider property investments.",
          },
          // Travel & Relocation
          {
            id: 24,
            title: "travel forecast",
            description:
              "The stars indicate favorable conditions for short travels in the coming days.",
          },
          {
            id: 25,
            title: "foreign settlement",
            description:
              "Your chart shows strong chances of foreign settlement in the next few years.",
          },
          // Astro Remedies & Rituals
          {
            id: 26,
            title: "gemstone recommendation",
            description:
              "Wearing a gemstone aligned with your ruling planet can strengthen positive energies. Would you like a recommendation?",
          },
          {
            id: 27,
            title: "puja suggestion",
            description:
              "Performing a Navagraha puja can help reduce negative planetary effects.",
          },
        ];
        setCannedMessages(data);
      } catch (error) {
        console.error("Error fetching canned messages:", error);
      }
    };

    if (token) {
      fetchCannedMessages();
    }
  }, [token]);

  useEffect(() => {
    const astroId = JSON.parse(localStorage.getItem("astro_user"))?.id;
    setToken(astroId || "");
  }, []);

  const initialTime = Number.isFinite(parseFloat(chat_time))
    ? parseInt(chat_time * 60)
    : 0;

  // Define handleTimerEnd before useEffect hooks
  const handleTimerEnd = useCallback(() => {
    setChatEnd(true);
    socket.emit(
      "complted_chat",
      { room_id: roomId, astroId: token, userId: userId },
      (response) => {
        if (response.success) {
        } else {
        }
      },
    );
    if (typeof window !== "undefined") {
      localStorage.removeItem(`endTime_${roomId}`);
    }
    router.push("/dashboard");
  }, [roomId, token, userId, socket, router]);

  // Always get endTime from localStorage if available, else set new
  const getEndTime = () => {
    if (!roomId) return null;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`endTime_${roomId}`);
      if (stored) return parseInt(stored);
      if (initialTime > 0) {
        const newEndTime = Date.now() + initialTime * 1000;
        localStorage.setItem(`endTime_${roomId}`, newEndTime);
        return newEndTime;
      }
    }
    return null;
  };

  useEffect(() => {
  console.log("REMEDY DATA", remedyData);
  console.log("REMEDY ERROR", remedyError);
}, [remedyData, remedyError]);

  const [endTime, setEndTime] = useState(getEndTime());
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== "undefined" && roomId) {
      const stored = localStorage.getItem(`endTime_${roomId}`);
      if (stored) {
        const now = Date.now();
        return Math.max(Math.floor((parseInt(stored) - now) / 1000), 0);
      }
    }
    return initialTime;
  });

  // Timer effect: always use localStorage for persistence
  useEffect(() => {
    if (endTime === null) return;
    let intervalId;
    const update = () => {
      const now = Date.now();
      const remainingMs = endTime - now;
      if (remainingMs <= 0) {
        setTimeLeft(0);
        handleTimerEnd();
        handleConfirmEndChat(true);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`endTime_${roomId}`);
        }
        clearInterval(intervalId);
        return;
      }
      setTimeLeft(Math.max(Math.floor(remainingMs / 1000), 0));
      if (typeof window !== "undefined") {
        localStorage.setItem(`endTime_${roomId}`, endTime);
      }
    };
    update();
    intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [endTime, roomId, handleTimerEnd]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (socket.connected) {
      socket.emit("joinChat", {
        username: "astrologer",
        room_id: roomId,
        joinpersonid: token,
      });
    } else {
      socket.on("connect", () => {
        socket.emit("joinChat", {
          username: "astrologer",
          room_id: roomId,
          joinpersonid: token,
        });
      });
      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }

    socket.on("user_disconnected", () => {
      try {
        setLeaveMessage("The Chat Session Successfully Completed, Thank You!");
        setShowPopup(true);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`endTime_${roomId}`);
        }
        setTimeout(() => {
          setShowPopup(false);
          router.push("/dashboard");
        }, 3000);
      } catch (error) {
        console.error("Error in user_disconnected:", error);
      }
    });

    socket.on("open_popup_astrologer", (data) => {
      try {
        if (data.roomId === roomId) {
          setRecharge(true);
        }
      } catch (error) {
        console.error("Error in open_popup_astrologer:", error);
      }
    });

    socket.on("customer_recharge_fail", (data) => {
      try {
        if (data.roomId === roomId) {
          setRecharge(false);
        }
      } catch (error) {
        console.error("Error in customer_recharge_fail:", error);
      }
    });

    socket.on("recharge_complted", (data) => {
      try {
        if (data?.roomId === roomId) {
          setRecharge(false);
          const newDueSeconds = Number.isFinite(parseFloat(data?.duetime))
            ? parseInt(data.duetime)
            : 0;
          if (newDueSeconds > 0) {
            const newEndTime = Date.now() + newDueSeconds * 1000;
            setEndTime(newEndTime);
            setTimeLeft(newDueSeconds);
            if (typeof window !== "undefined") {
              localStorage.setItem(`endTime_${roomId}`, newEndTime);
            }
          }
        }
      } catch (error) {
        console.error("Error in recharge_complted:", error);
      }
    });

    socket.on("complted_chat", (data) => {
      if (data.roomId === roomId) {
        try {
          setLeaveMessage(
            "The Chat Session Successfully Completed, Thank You!",
          );
          setEndAlert(false);
          setShowPopup(true);
          setRecharge(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem(`endTime_${roomId}`);
          }
          setTimeout(() => {
            setShowPopup(false);
            router.push("/dashboard");
          }, 3000);
        } catch (error) {
          console.error("Error in complted_chat:", error);
        }
      }
    });

    socket.on("receive_message", (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          msg_id: data?.msg_id,
          sender: data.sender,
          message: data.message,
          value: "test",
          time: data.time,
          image: data.image,
          replyTo: data.replyTo || null,
        },
      ]);
    });

    socket.on("typing", (data) => {
      if (data.user_name !== "Astrologer") {
        setTypingStatus(data.typing ? `typing...` : "");
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("leave_chat");
      socket.off("typing");
      socket.off("user_disconnected");
      socket.off("open_popup_astrologer");
      socket.off("recharge_complted");
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket, roomId, router, token, userId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // const handleMessageChange = (e) => {
  //   setMessage(e.target.value);
  //   socket.emit("typing", {
  //     room_id: roomId,
  //     typing: e.target.value.length > 0,
  //     user_name: "Astrologer",
  //   });

  //   clearTimeout(typingTimeoutRef.current);
  //   typingTimeoutRef.current = setTimeout(() => {
  //     socket.emit("typing", {
  //       room_id: roomId,
  //       typing: false,
  //       user_name: "Astrologer",
  //     });
  //   }, 2000);
  // };

  const handleMessageChange = (e) => {
  const value = e.target.value;

  setMessage(value);

  // -----------------------------------------
  // Clear previous typing timeout
  // -----------------------------------------
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  // -----------------------------------------
  // If message is empty
  // -----------------------------------------
  if (!value.trim()) {
    socket.emit("typing", {
      room_id: roomId,
      typing: false,
      user_name: "Astrologer",
    });

    console.log("⌨️ TYPING FALSE - EMPTY MESSAGE", {
      room_id: roomId,
      typing: false,
      user_name: "Astrologer",
    });

    return;
  }

  // -----------------------------------------
  // User started typing
  // -----------------------------------------
  socket.emit("typing", {
    room_id: roomId,
    typing: true,
    user_name: "Astrologer",
  });

  console.log("⌨️ TYPING TRUE", {
    room_id: roomId,
    typing: true,
    user_name: "Astrologer",
    messageLength: value.length,
  });

  // -----------------------------------------
  // Stop typing after 2 seconds
  // -----------------------------------------
  typingTimeoutRef.current = setTimeout(() => {
    socket.emit("typing", {
      room_id: roomId,
      typing: false,
      user_name: "Astrologer",
    });

    console.log("⌨️ TYPING FALSE - TIMEOUT", {
      room_id: roomId,
      typing: false,
      user_name: "Astrologer",
    });

    typingTimeoutRef.current = null;
  }, 2000);
};

  const sendMessage = async () => {
    if (!message.trim() && !imageFile) return;

    const sender_id = token;
    const received_id = userId;
    const room_id = roomId;
    const msg_id = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

    let imageUrl = null;

    try {
      // Upload image first
      if (imageFile) {
        console.log(imageFile);
        console.log(imageFile instanceof File);
        console.log(imageFile.constructor.name);
        const { data } = await uploadFile({
          variables: {
            file: imageFile,
          },
        });

        if (!data?.uploadFile?.success) {
          alert("Image upload failed.");
          return;
        }

        imageUrl = data.uploadFile.url;
      }

      socket.emit("send_message", {
        msg_id,
        sender_id,
        room_id,
        received_id,
        sender: "Astrologer",
        message: message.trim(),
        image: imageUrl,
        replyTo: replyTo
          ? {
              sender: "Astrologer",
              message: replyTo.message,
              image: replyTo.image || null,
            }
          : null,
      });

      setMessage("");
      setImageFile(null);
      setImagePreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setReplyTo(null);
      setShowCannedDropdown(false);
      setShowRemedyDropdown(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed.");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    const maxAllowedSizeMB = 5;

    if (file.size > maxAllowedSizeMB * 1024 * 1024) {
      alert("Image size should be less than 5 MB.");
      return;
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      };

      const compressedImage = await imageCompression(file, options);

      const compressedFile = new File([compressedImage], file.name, {
        type: compressedImage.type,
        lastModified: Date.now(),
      });

      setImageFile(compressedFile);

      setImagePreview(URL.createObjectURL(compressedImage));

      console.log(compressedFile instanceof File);

      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const endChat = () => {
    setShowConfirmModal(true);
  };

  const handleReply = (msgObj) => {
    setReplyTo(msgObj);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const handleConfirmEndChat = (confirm) => {
    if (confirm) {
      setEndAlert(true);
      socket.emit(
        "complted_chat",
        { room_id: roomId, astroId: token, userId },
        (response) => {
          if (response.success) {
            alert("Chat ended successfully.");
            if (typeof window !== "undefined") {
              localStorage.removeItem(`endTime_${roomId}`);
            }
          } else {
            alert("Failed to end the chat. Please try again.");
          }
        },
      );
    }
    setShowConfirmModal(false);
  };

  const handleOpenKundali = () => {
    const params = new URLSearchParams({
      source: "dashboard",
      name: userName || "",
      dob: bdate || "",
      time: btime || "",
      place: locationplace || "",
      lat: latitude?.toString() || "",
      lon: longitude?.toString() || "",
      tzone: "5.5",
    });

    window.open(
      `https://dhwani-astro-v2.vercel.app/freeservices/kundali/getKundaliPage?${params.toString()}`,
      "_blank",
    );
  };

  // Handle canned message selection
  const handleCannedMessageSelect = (description) => {
    setMessage(description);
    setShowCannedDropdown(false);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Handle remedy selection
  const handleRemedySelect = (description) => {
    setMessage(description);
    setShowRemedyDropdown(false);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const PROFILE_IMG_BASE =
    "https://webdemonew.dhwaniastro.co.in/public/cms-images/user-images/";
  const getProfileImgUrl = (img) =>
    img ? `/Dhwani-logo.jpg` : "/Dhwani-logo.jpg";

  useEffect(() => {
    const chatMessages = data?.getCurrentChatMessages?.data;
    if (!Array.isArray(chatMessages)) return;
    setMessages(
      chatMessages.map((msg) => ({
        msg_id: msg.msgId,
        sender: msg.sender,
        message: msg.message,
        time: msg.createdAt,
        image: msg.image,
        replyTo: msg.replyTo,
      })),
    );
  }, [data]);

  return (
    <>
      <div className="flex items-center justify-center h-screen justify-center items-center bg-[#120a18e7] relative overflow-hidden">
        <div className="absolute w-[400px] h-[400px] bg-purple-600 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]" />
        <div className="absolute w-[500px] h-[500px] bg-violet-500 opacity-20 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />
        <div className="md:w-3/5 overflow-hidden w-full bg-white shadow-lg rounded-2xl md:p-4 flex flex-col md:h-[95vh] h-[100vh]">
          <div className="flex justify-between items-center p-2 md:px-4 px-2 bg-[#2f1254] rounded-full">
            <div className="flex items-center gap-2 md:gap-4">
              <img
                src={getProfileImgUrl(userimage)}
                alt="Logo"
                className="h-auto rounded-full md:w-10 w-7"
              />
              <div className="flex flex-col text-sm text-white">
                <span className="md:text-[14px] text-[12px] font-semibold">
                  {userName}
                </span>
                <span className="text-yellow-400 text-[10px]">
                  {typingStatus || "Online"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 time-end">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-semibold text-[10px]">
                  Time :
                </span>
                <span className="border border-yellow-400 text-yellow-400 shadow-2xl overflow-hidden rounded-full px-2 py-1 text-[10px]">
                  {formatTime(timeLeft)} Min
                </span>
              </div>
              <button
                className="px-3 py-1 text-xs font-semibold  bg-red-600 border border-gray-400 shadow-2xl text-white overflow-hidden cursor-pointer rounded-full"
                onClick={endChat}
              >
                End
              </button>
            </div>
          </div>

          <div className="relative flex-grow">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-full h-full bg-center bg-cover opacity-50"
                style={{ backgroundImage: "url('/chatimg/bg-dsw.webp')" }}
              ></div>
            </div>

            <div className="relative p-4 space-y-2">
              <div className="flex flex-col gap-2 msgs-boxs">
                <div className="flex flex-col self-end bg-purple-200 rounded-lg px-3 py-2 text-black md:text-xs text-[10px] w-fit gap-1">
                  <div className="flex flex-col gap-1 msgs-det">
                    <span className="flex items-center gap-2">
                      <span>Name :</span>
                      <span>{userName}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>Gender :</span>
                      <span>{gender}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>DOB :</span>
                      <span>{bdate}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>TOB :</span>
                      <span>{btime}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>Place :</span>
                      <span>{locationplace}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>Occupation :</span>
                      <span>{occupation_user}</span>
                    </span>
                  </div>
                </div>

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`relative w-[60%] max-w-fit flex flex-col ${
                      msg.sender === "Astrologer"
                        ? "self-end bg-purple-200 me-7"
                        : "self-start bg-yellow-100 ms-7"
                    } rounded-lg px-3 py-2 text-gray-600 md:text-xs tracking-wide text-[10px] gap-0.5`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex flex-col gap-0 msgs-det">
                      {msg.replyTo && (
                        <div className="bg-gray-100 rounded-lg border-l-4 border-purple-500 p-2 mb-1 text-xs">
                          <span>
                            Reply to {msg.replyTo.sender || "User"}:{" "}
                            {msg.replyTo.message &&
                            msg.replyTo.message.length > 30
                              ? msg.replyTo.message.slice(0, 30) + "..."
                              : msg.replyTo.message}
                          </span>
                          {msg.replyTo.image && (
                            <span>
                              <Zoom>
                                <img
                                  src={msg.replyTo.image}
                                  alt="reply-img"
                                  className="inline-block object-cover w-8 h-8 align-middle border border-gray-300 rounded-md"
                                />
                              </Zoom>
                            </span>
                          )}
                        </div>
                      )}
                      {hoveredIndex === index && msg.message && (
                        <button
                          onClick={() => handleReply(msg)}
                          className="absolute top-[5px] left-[-20px] group"
                        >
                          <span className="relative self-end w-10 h-10 p-2 text-xs text-blue-500 underline border rounded-lg shadow-lg rep-i-pop bg-red border-gray-50">
                            <svg
                              className="text-blue-400"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 640 640"
                            >
                              <path
                                className="text-blue-400"
                                d="M364.2 82.4C376.2 87.4 384 99 384 112L384 192L432 192C529.2 192 608 270.8 608 368C608 481.3 526.5 531.9 507.8 542.1C505.3 543.5 502.5 544 499.7 544C488.8 544 480 535.1 480 524.3C480 516.8 484.3 509.9 489.8 504.8C499.2 496 512 478.4 512 448.1C512 395.1 469 352.1 416 352.1L384 352.1L384 432.1C384 445 376.2 456.7 364.2 461.7C352.2 466.7 338.5 463.9 329.3 454.8L169.3 294.8C156.8 282.3 156.8 262 169.3 249.5L329.3 89.5C338.5 80.3 352.2 77.6 364.2 82.6zM237.6 87.1C247 96.5 247 111.7 237.6 121L86.6 272L237.6 422.9C247 432.3 247 447.5 237.6 456.8C228.2 466.1 213 466.2 203.7 456.8L42 295.2C35.6 289.2 32 280.8 32 272C32 263.2 35.6 254.8 42 248.8L203.6 87.1C213 77.7 228.2 77.7 237.5 87.1z"
                              />
                            </svg>
                            <span className="rep-pop hidden text-[9px] group-hover:block absolute border bg-gray-500 rounded-lg text-white px-2 py-1 bottom-[22px] left-[-8px]">
                              Reply
                            </span>
                          </span>
                        </button>
                      )}
                      <span className="font-light break-all w-fit">
                        {msg.message}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 msgs-det">
                      {msg.image && (
                        <div
                          className="relative"
                          onMouseEnter={() => setHoveredIndex(index)}
                        >
                          <Zoom>
                            <img
                              src={msg.image}
                              alt="uploaded"
                              className="object-cover w-32 h-32 rounded-lg cursor-zoom-in"
                            />
                          </Zoom>
                          {hoveredIndex === index && (
                            <button
                              onClick={() => handleReply(msg)}
                              className="absolute top-1 left-[-34px] group z-10"
                            >
                              <span className="relative flex items-center self-end justify-center w-8 h-8 p-1 text-xs text-blue-500 underline border rounded-lg shadow-lg rep-i-pop bg-red border-gray-50">
                                <svg
                                  className="text-blue-400"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 640 640"
                                  width="16"
                                  height="16"
                                >
                                  <path
                                    className="text-blue-400"
                                    d="M364.2 82.4C376.2 87.4 384 99 384 112L384 192L432 192C529.2 192 608 270.8 608 368C608 481.3 526.5 531.9 507.8 542.1C505.3 543.5 502.5 544 499.7 544C488.8 544 480 535.1 480 524.3C480 516.8 484.3 509.9 489.8 504.8C499.2 496 512 478.4 512 448.1C512 395.1 469 352.1 416 352.1L384 352.1L384 432.1C384 445 376.2 456.7 364.2 461.7C352.2 466.7 338.5 463.9 329.3 454.8L169.3 294.8C156.8 282.3 156.8 262 169.3 249.5L329.3 89.5C338.5 80.3 352.2 77.6 364.2 82.6zM237.6 87.1C247 96.5 247 111.7 237.6 121L86.6 272L237.6 422.9C247 432.3 247 447.5 237.6 456.8C228.2 466.1 213 466.2 203.7 456.8L42 295.2C35.6 289.2 32 280.8 32 272C32 263.2 35.6 254.8 42 248.8L203.6 87.1C213 77.7 228.2 77.7 237.5 87.1z"
                                  />
                                </svg>
                                <span className="rep-pop hidden text-[9px] group-hover:block absolute border bg-gray-500 rounded-lg text-white px-2 py-1 bottom-[22px] left-[-8px]">
                                  Reply
                                </span>
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center self-end gap-1 time-check">
                      <span className="text-gray-500 text-[10px]">
                        {msg.time}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        <BiCheckDouble size={10} style={{ color: "#32CD32" }} />
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            </div>
          </div>

          {imagePreview && (
            <div className="image-preview-container">
              <img
                src={imagePreview}
                alt="Image preview"
                className="image-preview"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="remove-image-preview"
              >
                ✖
              </button>
            </div>
          )}
          {replyTo && (
            <div className="flex flex-col p-1 mt-1 text-sm bg-blue-100 border-l-4 border-purple-500 rounded-lg max-w-fit flex gap-5">
              <div className="flex items-center justify-between max-w-fit flex gap-5">
                <span className="text-gray-800 text-[11px] flex items-center">
                  <strong>Reply to {replyTo.sender}</strong>

                  <div className="mt-1">
                    {replyTo.message && replyTo.message.length > 30
                      ? replyTo.message.slice(0, 30) + "..."
                      : replyTo.message}
                  </div>
                  {replyTo.image && (
                    <span className="ml-2">
                      <Zoom>
                        <img
                          src={replyTo.image}
                          alt="reply-img"
                          className="inline-block object-cover w-8 h-8 align-middle border border-gray-300 rounded-md"
                        />
                      </Zoom>
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                  title="Cancel reply"
                >
                  &#10005;
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 relative">
            <div className="flex  items-center w-full border border-gray-300  rounded-full h-13 shadow inp-attach ps-2 pe-3">
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-grow w-full px-2 py-1 text-xs bg-white border-0 rounded-lg outline-none resize-none placeholder:text-xs md:py-2 focus:outline-none"
              />
              <div className="flex items-center gap-2 rounded-full bg-purple-200 shadow-2xl px-3 py-1  relative">
                <div className="relative">
                  <button
                    type="button"
                    className="p-1 text-xs text-white bg-violet-300 cursor-pointer rounded-full "
                    onClick={() => {
                      setShowCannedDropdown(!showCannedDropdown);
                      setShowRemedyDropdown(false);
                    }}
                    title="Select canned message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height={18}
                      width={18}
                      viewBox="0 0 640 640"
                    >
                      <path d="M64 304C64 358.4 83.3 408.6 115.9 448.9L67.1 538.3C65.1 542 64 546.2 64 550.5C64 564.6 75.4 576 89.5 576C93.5 576 97.3 575.4 101 573.9L217.4 524C248.8 536.9 283.5 544 320 544C461.4 544 576 436.5 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304zM158 471.9C167.3 454.8 165.4 433.8 153.2 418.7C127.1 386.4 112 346.8 112 304C112 200.8 202.2 112 320 112C437.8 112 528 200.8 528 304C528 407.2 437.8 496 320 496C289.8 496 261.3 490.1 235.7 479.6C223.8 474.7 210.4 474.8 198.6 479.9L140 504.9L158 471.9zM208 336C225.7 336 240 321.7 240 304C240 286.3 225.7 272 208 272C190.3 272 176 286.3 176 304C176 321.7 190.3 336 208 336zM352 304C352 286.3 337.7 272 320 272C302.3 272 288 286.3 288 304C288 321.7 302.3 336 320 336C337.7 336 352 321.7 352 304zM432 336C449.7 336 464 321.7 464 304C464 286.3 449.7 272 432 272C414.3 272 400 286.3 400 304C400 321.7 414.3 336 432 336z" />
                    </svg>
                  </button>
                  {showCannedDropdown && (
                    <div className="absolute bottom-10 left-0 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-1000 max-h-40 overflow-y-auto">
                      {cannedMessages.length > 0 ? (
                        cannedMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="px-3 py-2 text-xs text-gray-800 hover:bg-blue-100 cursor-pointer"
                            onClick={() =>
                              handleCannedMessageSelect(msg.description)
                            }
                            title={msg.title}
                          >
                            {msg.title}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          No canned messages available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="p-1 text-xs text-white bg-purple-300 rounded-full cursor-pointer flex items-center gap-1"
                    onClick={() => {
                      setShowRemedyDropdown(!showRemedyDropdown);
                      setShowCannedDropdown(false);
                    }}
                    title="Select remedy"
                  >
                    <svg height={18} width={18} viewBox="0 0 640 640">
                      <path d="M311.6 95C297.5 75.5 274.9 64 250.9 64C209.5 64 176 97.5 176 138.9L176 141.3C176 205.7 258 274.7 298.2 304.6C311.2 314.3 328.7 314.3 341.7 304.6C381.9 274.6 463.9 205.7 463.9 141.3L463.9 138.9C463.9 97.5 430.4 64 389 64C365 64 342.4 75.5 328.3 95L320 106.7L311.6 95zM141.3 405.5L98.7 448L64 448C46.3 448 32 462.3 32 480L32 544C32 561.7 46.3 576 64 576L384.5 576C413.5 576 441.8 566.7 465.2 549.5L591.8 456.2C609.6 443.1 613.4 418.1 600.3 400.3C587.2 382.5 562.2 378.7 544.4 391.8L424.6 480L312 480C298.7 480 288 469.3 288 456C288 442.7 298.7 432 312 432L384 432C401.7 432 416 417.7 416 400C416 382.3 401.7 368 384 368L231.8 368C197.9 368 165.3 381.5 141.3 405.5z" />
                    </svg>
                  </button>
                  {showRemedyDropdown && (
                    <div className="absolute bottom-10 left-0 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {remedyLoading ? (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          Loading remedies...
                        </div>
                      ) : remedyError ? (
                        <div className="px-3 py-2 text-xs text-red-500">
                          Failed to load remedies
                        </div>
                      ) : remedy.length > 0 ? (
                        remedy.map((item) => (
                          <div
                            key={item.id}
                            className="px-3 py-2 text-xs text-gray-800 hover:bg-green-100 cursor-pointer border-b border-gray-100 last:border-0"
                            onClick={() => handleRemedySelect(item.description)}
                            title={item.title}
                          >
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-[10px] text-gray-500 line-clamp-2">
                              {item.description.length > 60
                                ? item.description.slice(0, 60) + "..."
                                : item.description}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          No remedies available
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  hidden
  onChange={handleImageChange}
/>
                <button
                  type="button"
                  className="p-1 text-xs text-white bg-purple-400 rounded-full flex items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  title="Add File"
                >
                  <svg
                    height={18}
                    width={18}
                    className="cursor-pointer"
                    viewBox="0 0 640 640"
                  >
                    <path d="M288.6 76.8C344.8 20.6 436 20.6 492.2 76.8C548.4 133 548.4 224.2 492.2 280.4L328.2 444.4C293.8 478.8 238.1 478.8 203.7 444.4C169.3 410 169.3 354.3 203.7 319.9L356.5 167.3C369 154.8 389.3 154.8 401.8 167.3C414.3 179.8 414.3 200.1 401.8 212.6L249 365.3C239.6 374.7 239.6 389.9 249 399.2C258.4 408.5 273.6 408.6 282.9 399.2L446.9 235.2C478.1 204 478.1 153.3 446.9 122.1C415.7 90.9 365 90.9 333.8 122.1L169.8 286.1C116.7 339.2 116.7 425.3 169.8 478.4C222.9 531.5 309 531.5 362.1 478.4L492.3 348.3C504.8 335.8 525.1 335.8 537.6 348.3C550.1 360.8 550.1 381.1 537.6 393.6L407.4 523.6C329.3 601.7 202.7 601.7 124.6 523.6C46.5 445.5 46.5 318.9 124.6 240.8L288.6 76.8z" />
                  </svg>
                </button>

                <label htmlFor="image-upload" className="cursor-pointer">
                  <img
                    src="/kundli.png"
                    alt="kundali"
                    className="object-cover h-auto rounded-lg w-15"
                    onClick={handleOpenKundali}
                    title="Open Kundali"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={sendMessage}
              className="px-4 py-4 text-xs text-white bg-green-600 rounded-full bold-full"
            >
              <svg height={22} width={22} viewBox="0 0 640 640">
                <path
                  fill="rgb(255, 255, 255)"
                  d="M568.4 37.7C578.2 34.2 589 36.7 596.4 44C603.8 51.3 606.2 62.2 602.7 72L424.7 568.9C419.7 582.8 406.6 592 391.9 592C377.7 592 364.9 583.4 359.6 570.3L295.4 412.3C290.9 401.3 292.9 388.7 300.6 379.7L395.1 267.3C400.2 261.2 399.8 252.3 394.2 246.7C388.6 241.1 379.6 240.7 373.6 245.8L261.2 340.1C252.1 347.7 239.6 349.7 228.6 345.3L70.1 280.8C57 275.5 48.4 262.7 48.4 248.5C48.4 233.8 57.6 220.7 71.5 215.7L568.4 37.7z"
                />
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {showConfirmModal && (
              <>
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
                  <h2 className="mx-auto mb-3 font-bold">
                    Are you sure you want to end the chat?
                  </h2>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleConfirmEndChat(false)}
                      className="px-4 py-2 text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleConfirmEndChat(true)}
                      className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-500"
                    >
                      Yes
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {showPopup && <PopUp title={leaveMessage} buttontype={0} />}
          {chatend && (
            <PopUp
              title="Chat Completed!"
              subtitle="The session ended due to low user balance. Thank you!"
              buttontype={0}
            />
          )}
          {endAlert && (
            <PopUp
              title="Chat Completed!"
              subtitle="Please Wait.."
              buttontype={0}
            />
          )}
          {recharge && (
            <PopUp
              title="Customer Recharge!"
              subtitle="The session customer recharge due to low user balance please wait. Thank you!"
              buttontype={0}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AstrologerChat;
