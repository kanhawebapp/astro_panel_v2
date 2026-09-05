"use client";
import {  useGetStoreQuery } from '@/app/redux/slice/storeSlice';
import styles from '@/app/UI/features/StoreHistoryCard/storeHistory.module.css'
import  { useState } from "react";
import { FadeLoader } from 'react-spinners';
import useFilteredSearch from "@/hooks/useFilteredSearch";

const StoreHistoryCard = () => {
  
  const { data, error, isLoading } = useGetStoreQuery();
  const [selectedStore, setSelectedStore] = useState(null);
  

 
  const closeModal = () => {
    setSelectedStore(null);
  };
  const product = data?.products || {};
  const filteredData = useFilteredSearch(product, [
    "username",
    "user_id",
    "order_id",
    "product_name",
    "status",
    "created_at",
  ]);
  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center">
      <FadeLoader color="#2f1254" height={17} width={5} />
      <div className="mt-2">Loading call history...</div>
    </div>
  );
  if (error) return <p>Error fetching Remedy data.</p>;
  if (!data) return <p>API Response is undefined</p>;
 
  return (
    <div className={`${styles["calling-his"]} flex  justify-between flex-col  gap-2`}>
      <h2 className={`${styles["wallet-head"]} justify-center wallet-head text-center place-self-center`}>Dhwani Astro Store</h2>
      {filteredData.length === 0 ? (
         <div className="flex  justify-center items-center h-[50vh] w-full">
         <p className="text-gray-500 text-lg">No Store History</p>
       </div>
      ) : (
      <div className={`${styles["store-his-box"]}   grid grid-cols-2  sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5  py-5 gap-5 p-2   md:gap-[3rem]`}>
     {filteredData.map((card) => (
          <div className={`${styles["card-store"]} sm:w-[14rem] flex flex-col`} key={card.order_id}>
            <div className={`${styles["call-top"]} flex items-start justify-between`}>
              <div className={`${styles["cal-od-str"]} flex items-start justify-between flex-col`}>
                <span className={`${styles["store-top"]} flex flex-col md:flex-col xl:gap-[0.6rem] xl:flex-row xl:items-center`}>
                  <span className={`${styles["odr-sp"]} flex`}>Order ID :</span>
                  <span className={`${styles["id-nm"]}`}>{card.order_id}</span>
                </span>
                <span className={`${styles["store-top"]} flex flex-col md:flex-col xl:gap-[0.6rem] xl:flex-row xl:items-center`}>
                  <span className={`${styles["odr-sp"]} flex`}>Name:</span>
                  <span className={`${styles["id-nm"]}`}>{card.username} {`(${card.user_id})`}</span>
                </span>
              </div>
            </div>

            <hr style={{ margin: ".1rem" }} />

            <div className={`${styles["call-card-det"]} flex items-center justify-between`}>
              <div className={`${styles["cal-od-id"]} flex flex-col sm:gap-[0.6rem] sm:flex-row sm:items-center sm:justify-between`}>
                <span className={`${styles["odr-sp"]}`}>Product :</span>
                <span className={`${styles["id-nm"]}`}>{card.product_name}</span>
              </div> 
            
            </div>

            <div className={`${styles["call-rate"]} flex justify-between`}>
              <div className={`${styles["cal-od-id"]} flex flex-col sm:gap-[0.6rem]  sm:flex-row sm:items-center sm:justify-between`}>
                <span className={`${styles["odr-sp"]}`}>Status :</span>
                <span className={`${styles["id-nm"]} text-danger ${styles["text-danger"]}`}>
                  {card.status}
                </span>
              </div>
            </div>

            <div className={`${styles["call-dr"]} flex items-center justify-between`}>
              <div className={`${styles["cal-od-id"]} flex items-center justify-between`}>
                <span className={`${styles["odr-sp"]}`}>{card.created_at}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
      {selectedStore && (
        <div className="fixed inset-0 flex justify-center items-center bg-[#0000009a]">
          <div className="bg-white p-6 rounded-lg shadow-lg relative w-[400px]">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-red-500 text-xl"
            >
              ✖
            </button>
            <h4 className="text-xl ">{selectedStore.product_name}</h4>
            <img
              src={selectedStore.product_image || "/default-image.jpg"}
              className="mt-4 w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreHistoryCard;

// "use client";
// import { useState } from "react";
// import { useGetStoreQuery } from "@/app/redux/slice/storeSlice";
// import styles from "@/app/UI/features/StoreHistoryCard/storeHistory.module.css";
// import { FadeLoader } from "react-spinners";
// import useFilteredSearch from "@/hooks/useFilteredSearch";

// const StoreHistoryCard = () => {
//   const { data, error, isLoading } = useGetStoreQuery();
//   const [selectedStore, setSelectedStore] = useState(null);

//   const closeModal = () => {
//     setSelectedStore(null);
//   };

//   const product = data?.products || {};
//   const filteredData = useFilteredSearch(product, [
//     "username",
//     "user_id",
//     "order_id",
//     "product_name",
//     "status",
//     "created_at",
//   ]);

//   if (isLoading)
//     return (
//       <div className="h-screen flex flex-col justify-center items-center">
//         <FadeLoader color="#2f1254" height={17} width={5} />
//         <div className="mt-2">Loading store history...</div>
//       </div>
//     );

//   if (error) return <p>Error fetching store history data.</p>;
//   if (!data) return <p>API Response is undefined</p>;

//   return (
//     <div className="flex flex-col gap-4">
//       <h2 className="text-xl font-semibold text-center text-[#2f1254] mt-4">Dhwani Astro Store</h2>

//       {filteredData.length === 0 ? (
//         <div className="flex justify-center items-center h-[50vh] w-full">
//           <p className="text-gray-500 text-lg">No Store History</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 px-4 py-6">
//           {filteredData.map((card) => (
//             <div
//               key={card.order_id}
//               className="bg-white border border-[#d3b8ff] rounded-xl shadow-md p-4 w-full flex flex-col gap-2 text-sm"
//             >
//               <div className="text-[#6b21a8] font-semibold">
//                 Order ID: <span className="text-black">{card.order_id}</span>
//               </div>

//               <div className="text-[#6b21a8] font-semibold">
//                 Name:{" "}
//                 <span className="text-black">
//                   {card.username} ({card.user_id})
//                 </span>
//               </div>

//               <div>
//                 Product: <span className="text-black">{card.product_name}</span>
//               </div>

//               <div>
//                 Status:{" "}
//                 <span
//                   className={`font-semibold ${
//                     card.status.toLowerCase() === "completed"
//                       ? "text-green-600"
//                       : "text-red-500"
//                   }`}
//                 >
//                   {card.status}
//                 </span>
//               </div>

//               <div className="text-[#6b21a8] font-medium">{card.created_at}</div>
//             </div>
//           ))}
//         </div>
//       )}

//       {selectedStore && (
//         <div className="fixed inset-0 flex justify-center items-center bg-[#0000009a]">
//           <div className="bg-white p-6 rounded-lg shadow-lg relative w-[400px]">
//             <button
//               onClick={closeModal}
//               className="absolute top-2 right-2 text-red-500 text-xl"
//             >
//               ✖
//             </button>
//             <h4 className="text-xl ">{selectedStore.product_name}</h4>
//             <img
//               src={selectedStore.product_image || "/default-image.jpg"}
//               className="mt-4 w-full rounded-lg"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StoreHistoryCard;
