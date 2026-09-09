"use client";

import KundaliPage from "@/app/UI/kundliPage/KundaliPage";


export default function Page({ params }) {
  const { roomId } = params;

  return <KundaliPage roomId={roomId} />;
}