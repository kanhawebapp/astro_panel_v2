"use client";
import { useGetExpertProfileDetailsQuery } from "@/app/redux/slice/profileApi";
import styles from "@/app/UI/features/SettingPages/Pages/profile.module.css";

export default function ProfilUI() {
  const { data, error, isLoading } = useGetExpertProfileDetailsQuery();

  if (isLoading) return <p>Loading profile...</p>;
  if (error) return <p>Error fetching profile data.</p>;

  const profileData = data?.profileData || {};
  const imageUrl = `https://webdemonew.dhwaniastro.co.in/${profileData?.image_path}${profileData?.image}`;
  return (   
      
      <div className={`${styles["profile-page"]} flex`}>
        <div className={`${styles["pr-top"]} flex`}>
          <div className={`${styles["profile-det"]} flex justify-between`}>
            <div>
              <img
                src={imageUrl}
                alt="User"
                className={`${styles["p-astro-image"]}`}
              />
            </div>
            <div className={`${styles["pro-cont"]} flex justify-between`}>
              <div className={`${styles["pro-cont-top"]} flex justify-between`}>
                <div className={`${styles["t1"]}`}>
                  <span>Real Name : </span> <span>{profileData.full_name || "N/A"}</span>
                </div>
                <div className={`${styles["t1"]}`}>
                  <span>Display Name :</span>{" "}
                  {profileData.profile_name_en || "N/A"}
                </div>
              </div>
              <div
                className={`${styles["pro-cont-top"]} flex items-center justify-between`}
              >
                <div className={`${styles["t1"]}`}>
                  <span>Email ID :</span> {profileData.email || "tarottanvi@gmail.com"}
                </div>
                <div className={`${styles["t1"]}`}>
                  <span>Mobile Number :</span> {profileData.mobile || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        )}