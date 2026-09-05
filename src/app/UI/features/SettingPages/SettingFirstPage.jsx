"use client";

import styles from '@/app/UI/features/SettingPages/setting.module.css'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBuilding, FaAddressBook, FaUser, FaRupeeSign  } from "react-icons/fa";
import { TbReport } from "react-icons/tb";
import { BsBank2 } from "react-icons/bs";
import { useGetimportantNumberApiQuery } from '@/app/redux/slice/importantNumber';
import { useLogoutMutation } from '@/app/redux/slice/loginSlice';
import {logoutSuccess} from '@/app/redux/slice/authSlice'
import { useDispatch } from "react-redux";


export default function Settings() {
  const dispatch = useDispatch();
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [showImpPopup, setShowImpPopup] = useState(false);
  const{data, } =  useGetimportantNumberApiQuery();
 
  const [logout, { isLoading, isSuccess, isError, error }] = useLogoutMutation();
const router = useRouter();

const handleLogout = async (e) => {
  e.preventDefault();

  try {
    const result = await logout().unwrap(); 
    console.log("Logout successful:", result);


    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("USER");
    }
    dispatch(logoutSuccess());

    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed. Please try again.");
  }
};

  return (
    <>
    <div className={`${styles["dash-setting"]} flex items-center justify-center flex-col gap-4 sm:shadow-lg rounded-2xl bg-white p-6 lg:m-5`}>
      {/* <h2 className={`${styles["wallet-head"]} text-center`}>Settings</h2> */}
      <div className={`${styles["card-box"]} grid grid-cols-2 md:grid-cols-4   items-start flex-wrap  justify-center`}>
        <Link href="setting/bankdetails" className={`${styles["set-a"]}`}>
          <div className={`${styles["set-card-dash"]} bg-green-400 bg-opacity-75 gap-[10px] md:gap-[15px] flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Bank Details</h1>
            <span className={`${styles["set-img"]}`} >
              <BsBank2 className="text-warning" />
            </span>
          </div>
        </Link>

        {/* <a href="#" className={`${styles["set-a"]}`} onClick={() => setShowUpdatePopup(true)}>
          <div className={`${styles["set-card-dash"]} bg-blue-300 bg-opacity-75 gap-[10px] md:gap-[15px]  flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Update Number</h1>
            <span className={`${styles["set-img"]}`}>
              <FaAddressBook className="text-warning" />
            </span>
          </div>
        </a> */}

        <a href="#" className={`${styles["set-a"]}`} onClick={() => setShowImpPopup(true)}>
          <div className={`${styles["set-card-dash"]} bg-purple-400 bg-opacity-75 gap-[10px] md:gap-[15px]  flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Important Numbers</h1>
            <span className={`${styles["set-img"]}`}>
              <FaAddressBook className="text-warning" />
            </span>
          </div>
        </a>

        <Link href="setting/profilesetting" className={`${styles["set-a"]}`}>
          <div className={`${styles["set-card-dash"]} bg-amber-500 bg-opacity-75 gap-[10px] md:gap-[15px] flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>My Profile</h1>
            <span className={`${styles["set-img"]}`}>
              <FaUser className="text-warning" />
            </span>
          </div>
        </Link>

        <a href="https://webdemonew.dhwaniastro.co.in/terms-and-conditions-for-astrologer" className={`${styles["set-a"]}`}>
          <div className={`${styles["set-card-dash"]} bg-sky-300 bg-opacity-75 gap-[10px] md:gap-[15px] flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Terms & Conditions</h1>
            <span className={`${styles["set-img"]}`}>
              <TbReport className="text-warning h-[35px] w-[25px]" />
            </span>
          </div>
        </a>

        {/* <a href="setting/trainingVideo" className={`${styles["set-a"]}`}>
          <div className={`${styles["set-card-dash"]} bg-orange-400 bg-opacity-75 gap-[10px] md:gap-[15px] flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Training Videos</h1>
            <span className={`${styles["set-img"]}`}>
              <FaUser className="text-warning" />
            </span>
          </div>
        </a> */}

        <Link  href="setting/pricerequest" className={`${styles["set-a"]} `}>
          <div className={`${styles["set-card-dash"]} bg-gray-400 bg-opacity-75 gap-[10px] md:gap-[15px] flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Price Request</h1>
            <span className={`${styles["set-img"]}`}>
              <FaRupeeSign  className="text-warning" />
            </span>
          </div>
        </Link>

        {/* <Link href="setting/password" className={`${styles["set-a"]}`}>
          <div className={`${styles["set-card-dash"]} bg-indigo-400 bg-opacity-75 gap-[10px] md:gap-[15px]  flex flex-col items-center justify-between`}>
            <h1 className={`${styles["card-h1"]}`}>Passwords</h1>
            <span className={`${styles["set-img"]}`}>
              <FaLock className="text-warning" />
            </span>
          </div>
        </Link> */}
      </div>

  
      {showUpdatePopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-[#0000009a]">
            <form className="bg-white p-6 rounded-lg shadow-lg relative w-[400px]">
              <button onClick={() => setShowUpdatePopup(false)} className="absolute top-2  right-2 text-red-500 text-xl">
                ✖
              </button>
              <h1 className="text-xl font-bold">Update Phone Number</h1>
              <p>Call and chat notifications will be sent to these numbers.</p>

      
              <div className="flex flex-col mt-4">
                <label>Enter Primary Number</label>
                <div className="flex items-center space-x-2">
                  <select className="border p-2 rounded">
                    <option>+91 India</option>
                  </select>
                  <input type="tel" className="border p-2 rounded w-full" />
                  <button type="submit" className="bg-blue-500 text-white p-2 rounded">Submit</button>
                </div>
              </div>

              <div className="flex flex-col mt-4">
                <label>Enter Secondary Number</label>
                <div className="flex items-center space-x-2">
                  <select className="border p-2 rounded">
                    <option>+91 India</option>
                  </select>
                  <input type="tel" className="border p-2 rounded w-full" />
                  <button type="submit" className="bg-blue-500 text-white p-2 rounded">Submit</button>
                </div>
              </div>
            </form>
          </div>
        )}

      

{showImpPopup && (
  <div className="fixed inset-0 flex justify-center items-center bg-black/60 z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md relative px-6 py-8">
      
      <button
        onClick={() => setShowImpPopup(false)}
        className="absolute top-3  right-1  text-red-500 hover:text-red-700 text-2xl transition"
      >
        ✖
      </button>

      <h1 className="text-2xl font-bold text-center bg-[#2f1254] text-white rounded-t-xl py-3">
        Important Phone Numbers
      </h1>

      <p className="text-sm bg-[#7f56d93a] text-[#2f1254] px-4 py-2 mt-2 text-center rounded-lg">
        You will be receiving call and chat alerts from these numbers.
      </p>

      <div className="mt-6 space-y-4 text-sm text-gray-800">
        <div className="border-b pb-2">
          <p className="font-medium">📞 Dhwani Astro Call Number:</p>
          <p className="text-lg text-black">{data.data.dhwaniastrocall}</p>
        </div>

        <div className="border-b pb-2">
          <p className="font-medium">💬 Dhwani Astro Chat Number:</p>
          <p className="text-lg text-black">{data.data.dhwaniastrochat}</p>
        </div>

        <div>
          <p className="font-medium">📧 Other Contact Details:</p>
          <p className="text-lg text-black">{data.data.dhwaniadminsupport_contact}</p>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
    <a
  href="/"
  onClick={handleLogout}
  className={`${styles["set-a"]} flex items-center justify-center`}
>
  <div className={`${styles[""]} md:w-[20rem] w-[15rem] bg-[#2f1254] rounded-2xl bg-opacity-75 m-5 p-3 flex flex-col items-center justify-self-center`}>
    <h1 className={`${styles[""]} text-white `}>Signout</h1>
    
  </div>
</a>

  </>
  );
}
