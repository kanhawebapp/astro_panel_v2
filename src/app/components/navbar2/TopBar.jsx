"use client";

import styles from '@/app/components/navbar2/navbar2.module.css';
import { useState } from "react";
import { useGetExpertProfileDetailsQuery } from "@/app/redux/slice/profileApi";
import { FaSearch } from "react-icons/fa";
import { useSearch } from '@/ContextAPi/SearchContext';

const TopBar = () => {
  const { data } = useGetExpertProfileDetailsQuery();
  const { searchQuery, setSearchQuery } = useSearch();
  const profileData = data?.profileData || {};

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={`${styles.topMainDash} mt-[4.1rem] rounded-b-xl `}>
      <h3 className={styles.topGreetH3}>
        Hii <span className={styles.nameDy}>{profileData.name}</span>
      </h3>
      <span className={styles.dashSpanInp}>
        <input
          type="search"
          className={styles.dashInp}
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search..."
        />
        <i className="fa-solid fa-magnifying-glass">
          <FaSearch />
        </i>
      </span>
    </div>
  );
};

export default TopBar;



