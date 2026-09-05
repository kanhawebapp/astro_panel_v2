// import React from 'react';

// function getOrdinalSuffix(day) {
//   if (day >= 11 && day <= 13) return `${day}th`;
//   const j = day % 10;
//   if (j === 1) return `${day}st`;
//   if (j === 2) return `${day}nd`;
//   if (j === 3) return `${day}rd`;
//   return `${day}th`;
// }

// function formatToIST(timestamp) {
//   if (!timestamp) return "N/A";

//   try {
//     // Convert "YYYY-MM-DD HH:mm:ss" to ISO format
//     const isoString = timestamp.includes('T') 
//       ? timestamp
//       : timestamp.replace(" ", "T") + "Z";

//     const date = new Date(isoString);

//     // Convert to IST
//     const istDate = new Date(
//       date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//     );

//     const day = istDate.getDate();
//     const month = istDate.toLocaleString("en-IN", {
//       month: "long",
//       timeZone: "Asia/Kolkata"
//     });
//     const year = istDate.getFullYear();

//     const hours = istDate.getHours();
//     const minutes = istDate.getMinutes().toString().padStart(2, "0");
//     const seconds = istDate.getSeconds().toString().padStart(2, "0");
//     const ampm = hours >= 12 ? "PM" : "AM";
//     const hour12 = hours % 12 === 0 ? 12 : hours % 12;

//     return `${getOrdinalSuffix(day)} ${month} ${year}, ${hour12}:${minutes}:${seconds} ${ampm}`;
//   } catch (error) {
//     console.error("Invalid timestamp:", timestamp);
//     return "Invalid Date";
//   }
// }

// export default function ISTDateTimeDisplay({ timestamp }) {
//   return <span>{formatToIST(timestamp)}</span>;
// }
