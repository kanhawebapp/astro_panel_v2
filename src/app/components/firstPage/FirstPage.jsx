"use client";

import ButtonTileList from "@/app/UI/features/buttonui/ButtonTileList";
import CardBox from "@/app/UI/features/CardBox/CardBox";
// import FeedbackBoost from "@/app/UI/features/FeedbackBoost/FeedbackBoost";
import HomeMainCards from "@/app/UI/features/HomeCard/HomeMainCards";
import ManageServices from "@/app/UI/features/ManageServices/ManageServices";
import SupportChat from "@/app/UI/supportAPi/support";
import AstroChatBox from "@/app/components/AstroChatBox/AstroChatBox";
import ChatRequest from "@/component/ChatRequest";



export default function Firstpage() {
  return (
    <>
      <div className="">
     
        <HomeMainCards/>
        {/* <CardBox /> */}
        <ManageServices />
        <hr className="my-2" />
        <ButtonTileList />
        <hr className="my-2" />
        <SupportChat/>
        {/* <FeedbackBoost /> */}
        {/* <div className="relative"></div> */}
        {/* <AstroChatBox /> */}
      </div>
    </>
  );
}




