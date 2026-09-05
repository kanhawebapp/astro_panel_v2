"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "@/app/components/navbar/navbar.module.css";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IoMdSettings, IoMdLogOut } from "react-icons/io";
import { CgProfile } from "react-icons/cg";

import { toast } from "react-toastify";
import { gql } from "@apollo/client";

import { useGetExpertProfileDetailsQuery } from "@/app/redux/slice/profileApi";
import client from "../../../../utils/apolloClient";
import { useMutation } from "@apollo/client/react";

// ================= GRAPHQL =================

const LOGOUT_ASTROLOGER = gql`
  mutation {
    logoutAstrologer {
      message
      success
    }
  }
`;

// ================= COMPONENT =================

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data: expertData } = useGetExpertProfileDetailsQuery();
  const profileData = expertData?.profileData || {};

  const expertImageUrl =
    profileData?.image_path && profileData?.image
      ? `https://webdemonew.dhwaniastro.co.in/${profileData.image_path}${profileData.image}`
      : "/user2.png";

  const [logoutAstrologer] = useMutation(LOGOUT_ASTROLOGER);

  // ================= LOGOUT =================

 const handleLogout = async (e) => {
  e.preventDefault();

  try {
    const { data } = await logoutAstrologer({
      context: {
        fetchOptions: {
          credentials: "include",
        },
      },
    });

    if (data?.logoutAstrologer?.success) {
      toast.success(data.logoutAstrologer.message);
    } else {
      toast.error(data?.logoutAstrologer?.message || "Logout failed");
    }
  } catch (error) {
    console.error("Logout Error:", error);
    toast.error("Logout failed");
  } finally {
    // Clear frontend state
    localStorage.removeItem("astro_user");
    await client.clearStore();

    router.replace("/");
  }
};

  // ================= UI =================

  return (
    <div className={`${styles.container} flex items-center justify-center`}>
      <div className={styles.astrohead}>
        <div className="flex items-center justify-between w-full">
          {/* LOGO */}
          <div className={`${styles.logoImage} flex items-center ml-[3rem]`}>
            <Image src="/logo.png" alt="loading..." width="120" height="50" />
          </div>

          {/* PROFILE */}
          <div
            className={`${styles.astronavlinks} flex items-center justify-center`}
          >
            <div
              className="relative"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <div
                className={`text-white cursor-pointer mr-[1rem] ${styles.astroprofile}`}
              >
                <Image
                  src={expertImageUrl}
                  alt="profile"
                  width={35}
                  height={35}
                  className="w-12 h-12 rounded-full object-cover border-white shadow-md"
                />
              </div>

              {/* DROPDOWN */}
              <div
                className={`absolute right-0 bg-white rounded-lg shadow-lg z-50 ${
                  isOpen ? "block" : "hidden"
                }`}
              >
                <ul className="py-2 text-sm text-gray-700">
                  <li>
                    <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <CgProfile className="text-gray-500" />
                      <Link href="/dashboard/setting/profilesetting">
                        Profile
                      </Link>
                    </div>
                  </li>

                  <li>
                    <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <IoMdSettings className="text-gray-500" />
                      <Link href="/dashboard/setting">Settings</Link>
                    </div>
                  </li>

                  <li>
                    <div
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <IoMdLogOut className="text-gray-500" />
                      <span>Signout</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
