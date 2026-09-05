"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/app/redux/slice/authSlice";
import { useMutation } from "@apollo/client/react";

import styles from "@/app/login/login.module.css";
import PhoneInput from "./login/PhoneInput";

import { toast } from "react-toastify";
import client, { authTokenVar } from "../../utils/apolloClient";
import { gql } from "@apollo/client";
import Image from "next/image";
import Link from "next/link";

// ================= GRAPHQL =================

const REQUEST_OTP = gql`
  mutation RequestOtp($contactNo: String!) {
    requestAstrologerOtp(contactNo: $contactNo) {
      message
      success
    }
  }
`;

const VERIFY_OTP = gql`
  mutation ($contactNo: String!, $otp: String!) {
    verifyAstrologerOtp(contactNo: $contactNo, otp: $otp) {
      accessToken
      astrologer {
        id
        name
        contactNo
      }
    }
  }
`;

// ================= COMPONENT =================

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [requestOtp] = useMutation(REQUEST_OTP);
  const [verifyOtp] = useMutation(VERIFY_OTP);

  const getOtpBtnRef = useRef(null);
  const verifyBtnRef = useRef(null);

  const [otpSent, setOtpSent] = useState(1);
  const [otp, setOtp] = useState(["", "", "", ""]);

  const [phoneData, setPhoneData] = useState({
    e164: "",
    isValid: false,
  });

  // ================= SEND OTP =================

  const handleGetOTP = async () => {
    if (!phoneData.isValid) {
      toast.error("Invalid number");
      return;
    }

    try {
      const res = await requestOtp({
        variables: {
          contactNo: phoneData.raw,
          countryCode: phoneData.dialCode,
        },
      });

      toast.success(res.data.requestAstrologerOtp.message);
      setOtpSent(2);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ================= VERIFY OTP =================

  const handleVerifyOTP = async () => {
    const enteredOtp = otp.join("");

    try {
    const res = await verifyOtp({
      variables: {
        contactNo: phoneData.raw,
        otp: enteredOtp,
      },
      context: {
        fetchOptions: {
          credentials: "include", // ✅ MUST
        },
      },
    });
      const { accessToken, astrologer } = res.data.verifyAstrologerOtp;

      authTokenVar(accessToken);

      localStorage.setItem("astro_token", accessToken);
      localStorage.setItem("astro_user", JSON.stringify(astrologer));
      dispatch(
        setCredentials({ astro_user: astrologer, astro_token: accessToken }),
      );

      toast.success("Welcome");

      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ================= OTP INPUT =================

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/\D/, "");
    if (!val) return;

    const updated = [...otp];
    updated[i] = val;
    setOtp(updated);

    if (i < 3) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleBackspace = (e, i) => {
    if (e.key === "Backspace") {
      const updated = [...otp];
      if (otp[i]) updated[i] = "";
      else if (i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
      setOtp(updated);
    }
  };

  // ================= UI =================

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#120a18e7] relative overflow-hidden">
      <div className="absolute w-[700px] h-[700px] bg-purple-600 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-violet-500 opacity-20 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

      <div
        className="relative z-10 w-full max-w-md p-8 rounded-3xl 
      bg-black/20 backdrop-blur-xl border border-white/10
      shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-center space-y-3"
      >
        <div className={`${styles.logo} flex items-center justify-center`}>
          <Image
            src="/logo.png"
            alt="Logo"
            width={130}
            height={50}
            className={styles.logoImage}
          />
        </div>

        {otpSent === 1 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Astrologer Login
            </h2>
            <p className="text-gray-400 mb-6">
              Enter your number to receive OTP
            </p>

            <div className="flex flex-col gap-5 items-center">
              <PhoneInput onChange={setPhoneData} />

              <button
                onClick={handleGetOTP}
                className="w-[50%] py-3 rounded-full font-semibold text-white  cursor-pointer
              bg-gradient-to-r from-purple-600 to-violet-500
              hover:scale-[1.03] transition-all duration-200
              shadow-[0_0_20px_rgba(168,85,247,0.6)]
              active:scale-[0.98]"
              >
                Send OTP
              </button>
            </div>
          </>
        )}

        {otpSent === 2 && (
          <>
            <h3 className="text-xl font-semibold text-white mb-2">
              Verify OTP
            </h3>
            <p className="text-gray-400 mb-4">Sent to {phoneData.e164}</p>

            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleBackspace(e, i)}
                  className="w-12 h-12 text-lg text-center rounded-xl 
                bg-white/10 text-white border border-white/20
                focus:ring-2 focus:ring-purple-500 outline-none
                shadow-inner"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              className="w-full py-3 rounded-xl font-semibold text-white 
            bg-gradient-to-r from-purple-600 to-blue-500
            hover:scale-[1.03] transition-all duration-200
            shadow-[0_0_20px_rgba(168,85,247,0.6)]
            active:scale-[0.98]"
            >
              Verify OTP
            </button>
          </>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Secure Astrologer Access • Dhwani Astro
        </p>
      </div>
    </div>
  );
}
