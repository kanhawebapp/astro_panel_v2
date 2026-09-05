"use client";
import { useParams } from "next/navigation";

import Firstpage from "@/app/components/firstPage/FirstPage";
import CallHistoryCard from "@/app/UI/features/CallHistorycard/CallHistoryCard";
import ChatHistoryCard from "@/app/UI/features/ChatHistoryCard/ChatHistoryCard";
import EarningDashCard from "@/app/UI/features/EarningDash/EarningDashCard";
import LiveEvents from "@/app/UI/features/liveEvent/LiveEvent";
import Followers from "@/app/UI/features/MyFollowe/Follower";
import Review from "@/app/UI/features/MyReview/Review";
import Offers from "@/app/UI/features/Offer/OfferPage";
import Remedy from "@/app/UI/features/Remedies/Remedies";

import StoreHistoryCard from "@/app/UI/features/StoreHistoryCard/StoreHistoryCard";

import TransactionTable from "@/app/UI/features/Walletcard/Wallet";

import Bankdetail from "@/app/UI/SettingUI/bankDetails/bankdetail";
import PriceRequestCard from "@/app/UI/SettingUI/priceRequest";

import SupportChat from "@/app/UI/supportAPi/support";


import NoticeBoardPage from "@/app/UI/HomeCards/NoticeBoard";
import DosAndDontsPage from "@/app/UI/HomeCards/DosAndDont";
import ChatNotes from "@/app/UI/NotesPages/ChatNotes";
import CallNotes from "@/app/UI/NotesPages/CallNotes";
import KundaliPage from "@/app/UI/kundliPage/KundaliPage";
import AstroChatBox from "@/app/components/AstroChatBox/AstroChatBox";
import ViewChatHistory from "@/app/UI/features/viewChatHistory/ViewChat";




export default function DashboardSection() {


  const params = useParams();
  const path = params.slug || [];

  

  const sectionComponents = {
    firstpage: <Firstpage />,
    callhistory: <CallHistoryCard />,
    storehistory: <StoreHistoryCard />,
    chathistory: <ChatHistoryCard />,
    earningdash: <EarningDashCard />,
    wallet: <TransactionTable />,
    offer: <Offers />,
    remedy: <Remedy />,
    myreview: <Review />,
    liveevent: <LiveEvents />,
    supportChat: <SupportChat />,
    myfollower: <Followers />,
    astrochat: <AstroChatBox/>,
  };

  const settingComponents = {
    bankdetails: <Bankdetail />,
    pricerequest: <PriceRequestCard />,
  };

  const homeCards = {
    noticeBoard: <NoticeBoardPage/>,
    dosDonts: <DosAndDontsPage/>
  }
  const notes = {
    chatNotes :  <ChatNotes/>,
    callNotes : <CallNotes/>
  }

  let ComponentToRender = null;

  if (path.length === 1) {
    ComponentToRender =
      sectionComponents[path[0]] ||
      homeCards[path[0]] ||
      settingComponents[path[0]];
  } else if (path.length === 2 && path[0] === "setting") {
    ComponentToRender = settingComponents[path[1]];
  } else if (path.length === 2 && path[0] === "dashboard") {
    ComponentToRender = homeCards[path[1]];
   
  }else if (path.length === 3 && path[0] === "chathistory" && path[1] === "chatNotes") {
    const orderId = path[2];
    ComponentToRender = <ChatNotes orderId={orderId} />;
}else if (path.length === 3 && path[0] === "callhistory" && path[1] === "callNotes") {
  const orderId = path[2];
  ComponentToRender = <CallNotes orderId={orderId} />;
}
else if (path.length === 3 && (path[0] === "callhistory" || path[0] === "chathistory") && path[1] === "kundli") {
  const roomId = path[2];
  ComponentToRender = <KundaliPage roomId={roomId} />;
}
else if (
  path.length === 4 &&
  path[0] === "chathistory" &&
  path[1] === "view-chat"
) {
  const user_id = path[2];
  const order_id = path[3];
  ComponentToRender = <ViewChatHistory user_id={user_id} order_id={order_id} />;
}

  return (
    <>
      {ComponentToRender ? (
        ComponentToRender
      ) : (
        <div className="flex justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">Page Not Found</h1>
        </div>
      )}
    </>
  );
}
