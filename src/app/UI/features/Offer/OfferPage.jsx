"use client";

import styles from "@/app/UI/features/Offer/offer.module.css";
import { AntSwitch } from "../../SwitchButton/AntSwitch";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_OFFERS, UPDATE_OFFER_STATUS } from "@/app/utils/panelQueries";

const Offers = () => {
  const { data, loading, refetch } = useQuery(GET_OFFERS, {
    fetchPolicy: "network-only",
  });

  const [updateOfferStatus] = useMutation(UPDATE_OFFER_STATUS);

  const offers = data?.getOffers?.data || [];

  const handleToggle = async (offerId, currentStatus) => {
    try {
      // OFF kar raha hai
      if (currentStatus) {
        const { data } = await updateOfferStatus({
          variables: {
            offerId,
            selected: false,
             isActive: false,
          },
        });

        toast.success(
          data?.updateOfferStatus?.message || "Offer deactivated successfully",
        );

        refetch();
        return;
      }

      // ON karne ki koshish kar raha hai
      const activeOffer = offers.find(
        (offer) => offer.selected && offer.id !== offerId,
      );

      if (activeOffer) {
        toast.warning("Please deactivate the currently active offer first.");
        return;
      }

      const { data } = await updateOfferStatus({
        variables: {
          offerId,
          selected: true,
          isActive: true,
        },
      });

      toast.success(
        data?.updateOfferStatus?.message || "Offer activated successfully",
      );

      refetch();
    } catch (error) {
      toast.error(error?.message || "Failed to update offer");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10">Loading offers...</div>;
  }

  return (
    <div
      className={`${styles["card-panel-permi"]} flex items-center justify-center flex-col gap-4`}
    >
      <h2 className={`${styles["wallet-head"]} text-center py-5`}>Offers</h2>

      <div className="w-full">
        <hr />

        <div
          className={`${styles["tab-content"]} ${styles["b-feed-user"]} pt-3`}
        >
          <div className={`${styles["tab-pane"]} fade show active`}>
            <div
              className={`${styles["astro-main-ser"]} flex flex-wrap gap-5 justify-center md:justify-between`}
            >
              {offers?.map((offer) => (
                <div
                  key={offer.id}
                  className={`${styles["panel-access-box"]} flex items-start justify-between flex-col`}
                >
                  <div
                    className={`${styles["bg-glass"]} flex items-center justify-between flex-col`}
                  >
                    <div className="w-[15rem] sm:w-[20rem] min-h-[4rem] flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-[.7rem] md:text-[.9rem] font-semibold">
                          Offer Name:
                        </span>

                        <h3 className="mb-0 text-[.7rem] md:text-[.9rem]">
                          {offer.offerName}
                        </h3>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[.7rem] md:text-[.9rem] font-semibold">
                          Price:
                        </span>

                        <h3 className="mb-0 text-[.7rem] md:text-[.9rem]">
                          ₹{offer.price}
                        </h3>
                      </div>

                      {offer.description && (
                        <div className="flex justify-between gap-3">
                          <span className="text-[.7rem] md:text-[.9rem] font-semibold">
                            Description:
                          </span>

                          <h3 className="mb-0 text-[.7rem] md:text-[.9rem] text-right">
                            {offer.description}
                          </h3>
                        </div>
                      )}
                    </div>

                    <span className="flex items-center mt-4">
                      <span className="text-[.8rem] md:text-[.9rem]">
                        Status:
                      </span>

                      <div className="form-check form-switch ml-3">
                        <AntSwitch
                          checked={offer.selected}
                          onChange={() =>
                            handleToggle(offer.id, offer.selected)
                          }
                        />
                      </div>
                    </span>
                  </div>
                </div>
              ))}

              {offers.length === 0 && (
                <div className="text-center py-10">No offers found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
