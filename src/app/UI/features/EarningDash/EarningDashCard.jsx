// import styles from "@/app/UI/features/EarningDash/earningDash.module.css";
// import Link from "next/link";
// import { useGetWalletTransactionsQuery } from "@/app/redux/slice/walletSlice";

// const EarningDashCard = () => {
//   const { data, isLoading, error } = useGetWalletTransactionsQuery({
//     page: 1,
//     per_page: 1,
//   });

//   const summary = data?.summaryByProductType ?? {};

//   if (isLoading) {
//     return <div className="text-center py-8">Loading earnings...</div>;
//   }

//   if (error) {
//     return (
//       <div className="text-center py-8 text-red-500">
//         Failed to load earnings.
//       </div>
//     );
//   }

//   return (
//     <div className={`${styles["dash-earn-borx"]} p-5 bg-white bg-opacity-90 rounded-2xl shadow-2xl`}>
//       <div
//         className={`${styles["e-card"]} ${styles["playing"]} md:pr-[5rem] flex items-center justify-center`}
//       >
//         <div className={styles["wave"]}></div>
//         <div className={styles["wave"]}></div>
//         <div className={styles["wave"]}></div>
//         <div className={styles["infotop"]}>
//           <span
//             className={`${styles["total-earn"]} flex items-center justify-between`}
//           >
//             Life Time Earnings :{" "}
//             <span className={styles["tot-amt"]}>
//               ₹ {summary.Total_ASTRO_PAYOUT ?? "0.00"}
//             </span>
//           </span>
//           <Link href="/dashboard/wallet">
//             <button
//               className="transition-all duration-200 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 hover:from-yellow-500 hover:to-orange-500 text-white font-bold px-6 py-2 rounded-lg shadow-lg flex items-center gap-2 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
//             >
//               <i className="fa-solid fa-arrow-right-to-bracket"></i>
//               Show Wallet History
//             </button>
//           </Link>
//         </div>
//       </div>

//       <div
//         className={`${styles["earn-cards-bx"]} grid grid-cols-2 md:flex items-center justify-between md:flex-wrap`}
//       >
//         {/* Chat Card */}
//         <div className={`${styles["earn-card"]} flex items-center justify-between shadow-lg rounded-lg p-4 m-2`}>
//           <span className={`${styles["sp-ic-amt"]} flex items-start flex-col`}>
//             <div className={`${styles["top-greet-h3"]} mb-0`}>Chat</div>
//             <span className={styles["earn-amt"]}>₹ {summary.Total_Chat_Earning ?? "0.00"}</span>
//           </span>
//         </div>

//         {/* Call Card */}
//         <div className={`${styles["earn-card"]} flex items-center justify-between shadow-lg rounded-lg p-4 m-2`}>
//           <span className={`${styles["sp-ic-amt"]} flex items-start flex-col`}>
//             <div className={`${styles["top-greet-h3"]} mb-0`}>Call</div>
//             <span className={styles["earn-amt"]}>₹ {summary.Total_Calling_Earning ?? "0.00"}</span>
//           </span>
//         </div>

//         {/* Astro Payout Card */}
//         <div className={`${styles["earn-card"]} flex items-center justify-between  shadow-lg rounded-lg p-4 m-2`}>
//           <span className={`${styles["sp-ic-amt"]} flex items-start flex-col`}>
//             <div className={`${styles["top-greet-h3"]} mb-0`}>Total Astro Payout</div>
//             <span className={styles["earn-amt"]}>₹ {summary.Total_ASTRO_PAYOUT ?? "0.00"}</span>
//           </span>
//         </div>

//         {/* Fund Deduction Card */}
//         <div className={`${styles["earn-card"]} flex items-center justify-between  shadow-lg rounded-lg p-4 m-2`}>
//           <span className={`${styles["sp-ic-amt"]} flex items-start flex-col`}>
//             <div className={`${styles["top-greet-h3"]} mb-0`}>Total Fund Deduction</div>
//             <span className={styles["earn-amt"]}>₹ {summary.Total_Fund_Deducted ?? "0.00"}</span>
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EarningDashCard;

import styles from "@/app/UI/features/EarningDash/earningDash.module.css";
import Link from "next/link";
import { useGetWalletTransactionsQuery } from "@/app/redux/slice/walletSlice";
import {
  FaComments,
  FaPhoneAlt,
  FaWallet,
  FaMoneyBillWave,
} from "react-icons/fa";
// import {GiReceiveMoney} from "react-icons/gi";
import { GiTwoCoins } from "react-icons/gi";

const EarningDashCard = () => {
  const { data, isLoading, error } = useGetWalletTransactionsQuery({
    page: 1,
    per_page: 1,
  });

  const summary = data?.summaryByProductType ?? {};

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600">Loading earnings...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load earnings.
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md p-2 sm:p-3 md:p-6 rounded-3xl shadow-2xl border space-y-2 border-yellow-100">
      {/* Earnings Banner */}
      <div
        className={`${styles["e-card"]} ${styles["playing"]} md:pr-[5rem] text-xl md:text-2xl font-semibold flex items-center justify-center`}
      >
        <div className={styles["wave"]}></div>
        <div className={styles["wave"]}></div>
        <div className={styles["wave"]}></div>
        <div className={styles["infotop"]}>
          <div className="mt-4 md:mt-0 transition-all duration-300 bg-white text-[#6b4bad] font-bold px-5 py-1 rounded-full shadow  flex items-center gap-2 text-[1.3rem]  focus:outline-none">
  
            Lifetime Earnings:
            <span className="ml-3   rounded-2xl p-2 ">
              ₹ {summary.Total_ASTRO_PAYOUT ?? "0.00"}
            </span>
          </div>
          <Link href="/dashboard/wallet">
            <button className="mt-4 md:mt-0 transition-all duration-300 bg-white text-orange-500 font-semibold px-6 py-2 rounded-full shadow hover:bg-yellow-50 hover:scale-105 flex items-center gap-2 text-sm md:text-[1.3rem]  focus:outline-none">
              <i className="fa-solid fa-arrow-right-to-bracket"></i>
              Show Wallet History
            </button>
          </Link>
        </div>
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-15">
        {/* Chat */}
        <div className="bg-[#84c2ec] rounded-xl p-5 flex items-center gap-4 shadow hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <FaComments className="text-blue-500 text-3xl" />
          <div>
            <div className="text-gray-700 text-xl font-bold">Chat</div>
            <div className="text-xl font-semibold text-gray-800">
              ₹ {summary.Total_Chat_Earning ?? "0.00"}
            </div>
          </div>
        </div>

        {/* Call */}
        <div className="bg-[#a9ecbb] rounded-xl p-5 flex items-center gap-4 shadow hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <FaPhoneAlt className="text-green-500 text-3xl" />
          <div>
            <div className="text-gray-700 text-xl font-bold">Call</div>
            <div className="text-xl font-semibold text-gray-800">
              ₹ {summary.Total_Calling_Earning ?? "0.00"}
            </div>
          </div>
        </div>

        {/* Total Astro Payout */}
        <div className="bg-[#b7adf5] rounded-xl p-5 flex items-center gap-4 shadow hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <FaWallet className="text-purple-600 text-3xl" />
          <div>
            <div className="text-gray-700 text-xl font-bold">Astro Payout</div>
            <div className="text-xl font-semibold text-gray-800">
              ₹ {summary.Total_ASTRO_PAYOUT ?? "0.00"}
            </div>
          </div>
        </div>

        {/* Fund Deduction */}
        <div className="bg-[#ffa3c2] rounded-xl p-5 flex items-center gap-4 shadow hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          <FaMoneyBillWave className="text-red-500 text-3xl" />
          <div>
            <div className="text-gray-700 text-xl font-bold">Fund Deducted</div>
            <div className="text-xl font-semibold text-gray-800">
              ₹ {summary.Total_Fund_Deducted ?? "0.00"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningDashCard;
