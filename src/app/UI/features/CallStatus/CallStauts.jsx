// "use client"


// import { useGetCallStatusQuery } from '@/app/redux/slice/callStatus';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { PhoneIncoming, X } from 'lucide-react';

// const CallStatusCard = () => {
//   const [visible, setVisible] = useState(true);
//   const [callData, setCallData] = useState(null);
//   const [mounted, setMounted] = useState(false);
//   const router = useRouter();

//   const { data } = useGetCallStatusQuery(undefined, {
//     pollingInterval: 1000,
//   });

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (data && data.status === 200 && data.data.length > 0) {
//       setCallData(data.data[0]);
//       setVisible(true);
//     } else {
//       setCallData(null);
//     }
//   }, [data]);

//   if (!visible || !callData) return null;

//   const {
//     user_name,
//     form_meta,
//     call_status,
//     request_session_id,
//   } = callData;

//   const handleKundaliClick = () => {
//     router.push(`/dashboard/callhistory/kundli/${request_session_id}`);
//   };

//   return (
//     <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm z-[999] bg-white/90 backdrop-blur-md shadow-lg rounded-lg border border-gray-200 p-4">

//       <button
//         onClick={() => setVisible(false)}
//         className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
//         aria-label="Close"
//       >
//         <X size={20} />
//       </button>

//       <div className="flex items-center gap-2 mb-3">
//         <PhoneIncoming className="text-green-600" size={22} />
//         <h3 className="text-base font-semibold text-gray-800">Incoming Call</h3>
//       </div>

//       <div className="space-y-1 text-sm text-gray-700 leading-tight">
//         <p><span className="font-medium">Name:</span> {user_name}</p>
//         <p><span className="font-medium">Birth Place:</span> {form_meta?.birthPlace}</p>
//         <p><span className="font-medium">Birth Date:</span> {form_meta?.bidate}</p>
//         <p><span className="font-medium">Birth Time:</span> {form_meta.birthTimeHH}:{form_meta.birthTimeMM}</p>
//         <p><span className="font-medium">Call Status:</span> {call_status}</p>
//       </div>


//       <button
//         onClick={handleKundaliClick}
//         className="mt-4 w-full py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
//       >
//         View Kundali
//       </button>
//     </div>
//   );
// };

// export default CallStatusCard;
