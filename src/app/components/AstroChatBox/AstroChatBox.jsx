import Image from "next/image";
import { MdDoneAll, MdAttachment } from "react-icons/md";
import { FiSend } from "react-icons/fi";
import { useState } from "react";
import { usePostLiveChatMutation } from "@/app/redux/slice/astroChatApi";

export default function AstroChatBox() {
  const [message, setMessage] = useState("");
  const [postLiveChat, { isLoading, error, data }] = usePostLiveChatMutation();


  const roomid = "demo-room-id";
  const astroid = "demo-astro-id";

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await postLiveChat({ roomid, astroid }).unwrap();
      setMessage("");
      
    } catch (e) {
        console.error("Failed to send message:", e);
        
    }
  };

  return (
    <div className="md:w-3/5 w-full top-0 bg-white shadow-lg  rounded-lg md:p-4 p-2 flex flex-col md:h-[81vh] h-[100vh] pt-5 mx-auto">
      <div className="flex justify-between items-center p-2 md:px-4 px-2 bg-[#2f1254] rounded-lg">
        <div className="flex items-center md:gap-4 gap-2">
          <Image src="/chatimg/bg.png" alt="Logo" width={40} height={40} className="md:w-10 w-7 h-auto" />
          <div className="flex flex-col text-white text-sm">
            <span className="md:text-[14px] text-[12px] font-semibold">Astrologer Name</span>
            <span className="text-yellow-400 text-[10px]">Typing Status...</span>
          </div>
        </div>
        <div className="time-end flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-semibold text-[10px]">Balance :</span>
            <span className="border border-yellow-400 text-yellow-400 rounded-md px-2 py-1 text-[10px]">Time</span>
          </div>
          <button className="bg-yellow-400 text-black border border-red-500 px-3 py-1 rounded-lg text-xs font-semibold">
            End
          </button>
        </div>
      </div>

      <div className="flex-grow relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-full h-full bg-cover bg-center opacity-50"
            style={{ backgroundImage: "url('/chatimg/bg-dsw.webp')" }}
          ></div>
        </div>
        <div className="relative p-4 space-y-2">
          <div className="msgs-boxs flex flex-col gap-2">
            <div className="flex flex-col self-end bg-purple-200 rounded-lg px-3 py-2 text-[#000] md:text-xs text-[10px] w-fit gap-1">
              <div className="msgs-det flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span>Name : </span> <span>Happy</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>Gender : </span> <span>Male</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>DOB : </span> <span>12-03-1990</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>TOB : </span> <span>11:12:50 AM</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>Place : </span> <span>Jhajjar, Haryana, India</span>
                </span>
              </div>
              <div className="time-check flex items-center gap-1 self-end">
                <span className="text-gray-500 text-[10px]">12:30 AM</span>
                <span className="text-gray-500 text-[10px]">
                  {/* <i className="fa-solid text-blue-400 fa-check-double"></i> */}
                  <MdDoneAll className="text-blue-400" size={14} />
                </span>
              </div>
            </div>

            <div className="astro-msgs-left flex flex-col gap-2">
              <div className="flex flex-col  self-start bg-yellow-100 rounded-lg px-3 py-2 text-[#000] md:text-xs text-[10px] w-fit gap-0">
                <div className="msgs-det flex flex-col gap-1">
                  <span>Welcome to Dhwani Astro</span>
                </div>
                <div className="time-check flex items-center gap-1 self-end">
                  <span className="text-gray-500 text-[10px]">12:30 AM</span>
                </div>
              </div>
              <div className="flex flex-col self-start bg-yellow-100 rounded-lg px-3 py-2 text-[#000] md:text-xs text-[10px] w-fit gap-0">
                <div className="msgs-det flex flex-col gap-1">
                  <span>Astrologer will join in 10 secs.</span>
                </div>
                <div className="time-check flex items-center gap-1 self-end">
                  <span className="text-gray-500 text-[10px]">12:30 AM</span>
                </div>
              </div>
              <div className="flex flex-col self-start bg-yellow-100 rounded-lg px-3 py-2 text-[#000] md:text-xs text-[10px] w-fit gap-0">
                <div className="msgs-det flex flex-col gap-1">
                  <span>Please share you questions in the meanwhile.</span>
                </div>
                <div className="time-check flex items-center gap-1 self-end">
                  <span className="text-gray-500 text-[10px]">12:30 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-2 border-t ">
        <div className="inp-attach border rounded-full gap-2 items-center flex px-5 w-full">
          <input
            type="text"
            placeholder="Type your messageee..."
            className="flex-grow px-2 md:py-2 py-1 focus:outline-none rounded-full"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <div className="right-items flex items-center gap-5">
            <Image src="/chatimg/kundli.webp" width={20} height={20} className="w-4 h-4 md:w-7 md:h-7" alt="" />
            <MdAttachment className="rotate-140 text-purple-300 " size={22} />
          </div>
        </div>
        <button
          className="bg-green-500 text-white px-6 py-0 text-xs rounded-full hover:bg-green-600"
          onClick={handleSend}
          disabled={isLoading}
        >
          <FiSend className="text-white" size={18} />
        </button>
      </div>
      
      {error && <div className="text-red-500 text-xs p-2">Failed to send message</div>}
    </div>
  );
}