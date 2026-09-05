"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function UpcomingFeaturesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const title = searchParams.get("title") || "Feature";
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      
      <h1 className="text-3xl font-bold text-purple-700 mb-4">{title}</h1>
      <p className="text-lg text-gray-600">This feature is coming soon!</p>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow hover:from-purple-600 hover:to-blue-600 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>
    </div>
  );
}

// 'use client';

// import { useEffect, useState } from 'react';
// import { useSearchParams } from 'next/navigation';

// export default function UpcomingFeaturesPage() {
//   const searchParams = useSearchParams();
//   const title = searchParams.get('title');

//   const [location, setLocation] = useState(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     // Only trigger if title is present
//     if (!title) return;

//     if ('geolocation' in navigator) {
//       console.log("Requesting location...");
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const coords = {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//           };
//           console.log("User Location:", coords);
//           setLocation(coords);
//         },
//         (err) => {
//           console.error("Geolocation error:", err.message);
//           setError(err.message);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0,
//         }
//       );
//     } else {
//       const errMsg = 'Geolocation not supported by browser';
//       console.error(errMsg);
//       setError(errMsg);
//     }
//   }, [title]);

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">Title: {title}</h1>

//       {location ? (
//         <div>
//           <p>Latitude: {location.latitude}</p>
//           <p>Longitude: {location.longitude}</p>
//         </div>
//       ) : error ? (
//         <p className="text-red-500">Error: {error}</p>
//       ) : (
//         <p>Requesting location...</p>
//       )}
//     </div>
//   );
// }
