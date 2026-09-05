"use client";
import { useEffect, useRef, useState } from "react";
import { useGetExpertProfileDetailsQuery } from "@/app/redux/slice/profileApi";
import styles from "@/app/UI/features/SettingPages/Pages/profile.module.css";
import ProfilUI from "../ProfileHeader";
import { saveAs } from "file-saver";

export default function Bankdetail() {
  const { data, error, isLoading } = useGetExpertProfileDetailsQuery();
  const [showFullImage, setShowFullImage] = useState(false);
  const closeButtonRef = useRef(null);

  const profileData = data?.profileData || {};
  const accountDetails = data?.accountDetails || {};
  const passbookImgUrl = accountDetails.image
    ? `https://webdemonew.dhwaniastro.co.in/public/cms-images/bank-data/${accountDetails.image}`
    : null;

  const handleDownloadImage = async () => {
    const response = await fetch(passbookImgUrl);
    const blob = await response.blob();
    saveAs(
      blob,
      `Passbook_${accountDetails.account_holder_name || "image"}.jpg`
    );
  };
  // ESC key support for modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowFullImage(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Focus the close button when modal opens
  useEffect(() => {
    if (showFullImage && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [showFullImage]);

  if (isLoading)
    return (
      <p className="text-center text-gray-600 text-lg">Loading profile...</p>
    );

  if (error)
    return (
      <p className="text-center text-red-500 font-semibold">
        Error fetching profile data.
      </p>
    );

  return (
    <div className={`${styles["calling-his"]} flex flex-col items-center`}>
      <h2 className="wallet-head text-center">Bank Details</h2>
      <ProfilUI />

      <div className="p-6 w-full bg-[#ffffff6e] shadow-lg rounded-2xl mx-auto border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Bank Information
        </h2>

        {/* Modal */}
        {showFullImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000c7] bg-opacity-70"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => {
              if (e.target.id === "modal-bg") setShowFullImage(false);
            }}
            id="modal-bg"
          >
            <div className="relative bg-white rounded-lg top-7 shadow-lg p-5 w-[60vw] h-[70vh] flex flex-col items-center justify-center">
              {/* Close Icon */}
              <button
                ref={closeButtonRef}
                onClick={() => setShowFullImage(false)}
                aria-label="Close"
                className="absolute top-0 right-2 text-gray-500 hover:text-red-600 text-5xl focus:outline-none"
              >
                &times;
              </button>

              {/* Image */}
              <img
                src={passbookImgUrl}
                alt="Full Passbook"
                className="w-[100%] h-[100%] rounded-lg object-contain "
              />

              {/* Download Button */}

              <div className="flex justify-center mt-1">
                <a
                 href={passbookImgUrl}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all duration-200 shadow"
                >
                  Download Image
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Bank Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700 mt-4">
          <BankDetailItem label="Bank Name" value={accountDetails.bank_name} />
          <BankDetailItem
            label="Account Holder"
            value={accountDetails.account_holder_name}
          />
          <BankDetailItem
            label="Account Number"
            value={accountDetails.account_no}
          />
          <BankDetailItem label="IFSC Code" value={accountDetails.bank_ifsc} />
          <BankDetailItem label="Pan Card" value={profileData.pancard_no} />
          {/* Button to open modal */}
          {passbookImgUrl && (
            <div className="flex justify-center mt-4 mb-6">
              <button
                onClick={() => setShowFullImage(true)}
                className="px-4 py-2 bg-violet-950 rounded-lg text-sm text-white transition-all duration-200"
              >
                View Passbook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const BankDetailItem = ({ label, value }) => (
  <div className="flex-col gap-2">
    <div className="font-medium text-xs md:text-sm text-gray-900">
      {label} :
    </div>
    <span className="input-data">{value || "Not Updated"}</span>
  </div>
);
