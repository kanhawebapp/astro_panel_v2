"use client";

import styles from "@/app/UI/features/SettingPages/Pages/profile.module.css";
import ProfilUI from "@/app/UI/SettingUI/ProfileHeader";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_ASTROLOGER_PROFILE = gql`
  query GetAstrologerProfile {
    getAstrologerProfile {
      success
      message
      data {
        id
        profilePic
        name
        displayName
        email
        contactNo
        about
        gender
        languages
        skills
        problems
        experience
        rating
        tags
        vtags
        status
        createdAt
        totalReviews
        totalSessions

        pricing {
          id
          type
          price
          offerPrice
          commissionPercent
          isActive
        }

        wallet {
          balanceCoins
          totalEarned
          totalWithdrawn
        }

        recentReviews {
          id
          rating
          comment
          reply
          userName
          createdAt
        }

        addresses {
          street
          city
          state
          country
          pincode
        }

        experiences {
          platformName
          yearsWorked
        }

        kycDetail {
          accountHolderName
          accountNumber
          bankName
          ifsc
          branchName
          panNumber
          aadhaarImage
          panImage
          passbookImage
          status
        }
      }
    }
  }
`;

export default function ProfileSettings() {
  const { data, loading, error } = useQuery(
    GET_ASTROLOGER_PROFILE
  );

  if (loading) return <p>Loading profile...</p>;

  if (error) {
    return (
      <p className="text-red-500">
        {error.message || "Error fetching profile data"}
      </p>
    );
  }

  const response = data?.getAstrologerProfile;

  const profileData = response?.data || {};
  const address = profileData?.addresses?.[0] || {};
  const wallet = profileData?.wallet || {};
  const pricing = profileData?.pricing?.[0] || {};
  const kyc = profileData?.kycDetail || {};

  return (
    <div
      className={`${styles["calling-his"]} flex items-center justify-center flex-col`}
    >
      <div className="wallet-head text-center justify-center items-center">
        Profile Settings
      </div>

      {/* <ProfilUI /> */}

      <div className={`${styles["profile-page"]} flex`}>
        <div className="p-6 w-full bg-[#ffffff6e] shadow-md rounded-2xl max-w-full mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Profile Information
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-medium">Real Name :</span>
              <span className="input-data">
                {profileData?.name || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Display Name:</span>
              <span className="input-data">
                {profileData?.displayName || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Skill:</span>
              <span className="input-data">
                {profileData?.skills?.length
                  ? profileData.skills.join(", ")
                  : "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Language:</span>
              <span className="input-data break-all">
                {profileData?.languages?.length
                  ? profileData.languages.join(", ")
                  : "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Experience:</span>
              <span className="input-data">
                {profileData?.experience || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Rating:</span>
              <span className="input-data">
                {profileData?.rating || "0"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Reviews:</span>
              <span className="input-data">
                {profileData?.totalReviews || "0"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Sessions:</span>
              <span className="input-data">
                {profileData?.totalSessions || "0"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Current Address:</span>
              <span className="input-data break-all">
                {address?.street || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">City:</span>
              <span className="input-data">
                {address?.city || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">State:</span>
              <span className="input-data">
                {address?.state || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Country:</span>
              <span className="input-data">
                {address?.country || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Pincode:</span>
              <span className="input-data">
                {address?.pincode || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Email:</span>
              <span className="input-data break-all">
                {profileData?.email || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Contact:</span>
              <span className="input-data">
                {profileData?.contactNo || "Not Updated"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-medium">Gender:</span>
              <span className="input-data">
                {profileData?.gender || "Not Updated"}
              </span>
            </div>
          </div>

          {/* About */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="input-data min-h-[100px]">
              {profileData?.about || "Not Updated"}
            </p>
          </div>

          {/* Wallet */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">
              Wallet Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium">
                  Balance Coins
                </span>
                <div className="input-data">
                  {wallet?.balanceCoins ?? 0}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  Total Earned
                </span>
                <div className="input-data">
                  {wallet?.totalEarned ?? 0}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  Total Withdrawn
                </span>
                <div className="input-data">
                  {wallet?.totalWithdrawn ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">
              Pricing Information
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-medium">Type</span>
                <div className="input-data">
                  {pricing?.type || "N/A"}
                </div>
              </div>

              <div>
                <span className="font-medium">Price</span>
                <div className="input-data">
                  ₹{pricing?.price || 0}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  Offer Price
                </span>
                <div className="input-data">
                  ₹{pricing?.offerPrice || 0}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  Commission
                </span>
                <div className="input-data">
                  {pricing?.commissionPercent || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* KYC */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">
              KYC Details
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-medium">
                  Account Holder
                </span>
                <div className="input-data">
                  {kyc?.accountHolderName ||
                    "Not Updated"}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  Bank Name
                </span>
                <div className="input-data">
                  {kyc?.bankName || "Not Updated"}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  Account Number
                </span>
                <div className="input-data">
                  {kyc?.accountNumber ||
                    "Not Updated"}
                </div>
              </div>

              <div>
                <span className="font-medium">
                  IFSC
                </span>
                <div className="input-data">
                  {kyc?.ifsc || "Not Updated"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}