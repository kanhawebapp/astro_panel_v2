import React from "react";
import styles from "@/app/UI/features/CardBox/cardbox.module.css";
import { useGetExpertProfileDetailsQuery } from "@/app/redux/slice/profileApi";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Link from "next/link";
// import { Fragment } from 'react';

const CardBox = () => {
  const { data, error, isLoading } = useGetExpertProfileDetailsQuery();

  const totalAvgRating = parseFloat(data?.totalAvgRating) || 0;
  // const totalAvgRating = 1.4;
  const cards = [
    {
      title: "Training Videos",
      href: "dashboard/upcomingFeatures?title=Training%20Videos",
      buttonText: "Click Here",
      type: "button",
      id: "card1",
    },
    {
      title: "Check Your Performance",
      href: "dashboard/upcomingFeatures?title=Check%20Your%20Performance",
      buttonText: "Click Here",
      type: "button",
      id: "card2",
    },
    {
      title: "Ratings",
      buttonText: "",
      type: "rating",
      rate: "5",
      id: "card3",
    },
    {
      title: "Recommended Products",
      href: "dashboard/upcomingFeatures?title=Recommended%20Products",
      buttonText: "Click Here",
      type: "button",
      id: "card4",
    },
  ];

  return (
    <div
      className={`${styles.cardTopSmBox} grid grid-cols-2 md:grid-cols-4 items-center justify-between flex-wrap`}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${styles.cardDash} flex flex-col items-center justify-between`}
        >
          <h1 className={styles.cardH1}>{card.title}</h1>


          {card.type === "button" && card.href ? (
            <Link href={`/${card.href}`} passHref>
              <button className={styles.cardBtn}>{card.buttonText}</button>
            </Link>
          ) : card.type === "button" ? (
            <button className={styles.cardBtn} disabled>{card.buttonText}</button>
          ) : null}
       

          {card.type === "rating" && (
            <>
              <span>{totalAvgRating} / {card.rate} </span>
            <span className={styles.revSp}>
              <div className={styles.starRatingRev}>
                <Stack spacing={1}>
                  <Rating
                    name="half-rating-read"
                    value={totalAvgRating}
                    precision={0.5}
                    readOnly
                    sx={{
                      color: totalAvgRating < 3 ? "red" : totalAvgRating > 3.5 ? "#32cd32" : "default",
                    }}
                  />
                </Stack>
              </div>
            </span>
            </>
          )}
        </div>
      ))}
 
    </div>
  );
};

export default CardBox;
