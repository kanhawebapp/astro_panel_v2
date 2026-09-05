"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  MdHome,
  MdHourglassTop,
  MdLiveTv,
  MdOutlineSupportAgent,
} from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import {
  FaWallet,
  FaStore,
  FaMoneyCheck,
  FaHandHoldingHeart,
} from "react-icons/fa";
import { IoIosChatbubbles, IoIosGift } from "react-icons/io";
import { IoCall, IoSettingsOutline } from "react-icons/io5";
import { GiRemedy } from "react-icons/gi";
import { RiUserFollowLine } from "react-icons/ri";
import { FiMenu, FiX } from "react-icons/fi";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: <MdHome /> },
  {
    label: "Order History",
    icon: <CgProfile />,
    subItems: [
      {
        href: "/dashboard/chathistory",
        label: "Chat History",
        icon: <IoIosChatbubbles />,
      },
      {
        href: "/dashboard/call-history",
        label: "Call History",
        icon: <IoCall />,
      },
      {
        href: "/dashboard/storehistory",
        label: "Store History",
        icon: <FaStore />,
      },
    ],
  },
  { href: "/dashboard/earnings", label: "Earnings", icon: <FaMoneyCheck /> },
  { href: "/dashboard/wallet", label: "Wallet", icon: <FaWallet /> },
  { href: "/dashboard/offer", label: "Offers", icon: <IoIosGift /> },
  { href: "/dashboard/remedy", label: "Remedies", icon: <GiRemedy /> },
  { href: "/dashboard/services", label: "Services", icon: <FaMoneyCheck /> },
  // { href: "/dashboard/waitlist", label: "Wait List", icon: <MdHourglassTop /> },
  {
    href: "/dashboard/myreview",
    label: "My Review",
    icon: <FaHandHoldingHeart />,
  },
  { href: "/dashboard/liveevent", label: "Live Events", icon: <MdLiveTv /> },
  {
    href: "/dashboard/myfollower",
    label: "My Followers",
    icon: <RiUserFollowLine />,
  },
  // { href: "/dashboard/supportChat", label: "Support Chat", icon: <MdOutlineSupportAgent /> },
  {
    href: "/dashboard/setting",
    label: "Settings",
    icon: <IoSettingsOutline />,
  },
];

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isSidebarOpen ? "hidden" : "auto";
    }
  }, [isSidebarOpen, isMobile]);

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
        setIsMobile(true);
      } else {
        setIsSidebarOpen(true);
        setIsMobile(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleClickOutside = (event) => {
    if (
      isMobile &&
      isSidebarOpen &&
      !event.target.closest("aside") &&
      !event.target.closest("button")
    ) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebarOpen, isMobile]);

  return (
    <>
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-[999] text-white bg-[#2f1254] p-2 rounded-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FiMenu size={24} />
        </button>
      )}
    
      <aside
        className={`card-main bg-[#2f1254] text-white rounded-e-2xl transition-transform duration-300 overflow-y-auto
  ${
    isMobile
      ? "fixed top-0 left-0 w-64 h-screen mt-19 z-[999]"
      : "sticky top-[4.8rem] h-[calc(100vh-4.4rem)] "
  }
  ${isSidebarOpen || !isMobile ? "translate-x-0" : "-translate-x-full"}
`}
      >
        {" "}
        {isMobile && (
          <div className="">
            <button
              className="  absolute top-4  right-1 z-[999] text-white bg-[#7E60BF] p-2 rounded-md"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiX size={25} />
            </button>
          </div>
        )}
        <ul className="py-1 space-y-1 md:space-y-3 px-3">
          {menuItems.map((item, index) => (
            <li key={index} className="relative">
              {item.subItems ? (
                <div className="relative">
                  <button
                    className="flex items-center w-48 px-4 py-2 text-left rounded-xl hover:bg-[#7E60BF] border-b border-[#77777742]"
                    onClick={() =>
                      setOpenDropdown(openDropdown === index ? null : index)
                    } // Toggle dropdown
                  >
                    <span className="text-lg mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                  {openDropdown === index && (
                    <ul className="pl-8 space-y-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link
                            href={subItem.href}
                            className="flex items-center  px-4 py-2 text-sm rounded-md hover:bg-[#7E60BF] border-b border-[#77777742]"
                            onClick={() => isMobile && setIsSidebarOpen(false)}
                          >
                            <span className="text-base mr-2">
                              {subItem.icon}
                            </span>
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center w-48 px-4 py-2 rounded-xl hover:bg-[#7E60BF] border-b border-[#77777742]"
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <span className="text-lg mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
