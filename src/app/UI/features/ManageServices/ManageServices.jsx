"use client";

import { useState, useEffect } from "react";
import styles from "@/app/UI/features/ManageServices/manageservices.module.css";
import { AntSwitch } from "../../SwitchButton/AntSwitch";
import { useMutation, useQuery } from "@apollo/client/react";
import toast from "react-hot-toast";

import {
  TOGGLE_ASTROLOGER_SERVICE,
  GET_ASTROLOGER_SERVICES,
  GetAstrologerAnalytics,
} from "@/app/utils/panelQueries";
const SERVICE_MAP = {
  chat: "CHAT",
  call: "CALL",
  live: "LIVE",
  promo: "PROMOTIONAL",
};

const ManageServices = () => {
  const [astrologerId, setAstrologerId] = useState("");
  useEffect(() => {
    const astroData = JSON.parse(localStorage.getItem("astro_user") || "{}");

    if (astroData?.id) {
      setAstrologerId(astroData.id);
    }
  }, []);

  const [panels, setPanels] = useState([
    {
      type: "Chat",
      key: "chat",
      status: "Offline",
      id: "flexSwitchCheckDefault1",
    },
    {
      type: "Call",
      key: "call",
      status: "Offline",
      id: "flexSwitchCheckDefault2",
    },
    {
      type: (
        <>
          Live Stream <br />
          Audio/Video
        </>
      ),
      key: "live",
      status: "Offline",
      id: "flexSwitchCheckDefault3",
    },
    {
      type: (
        <>
          Promo Offer <br />
          (Serve/Limit)
        </>
      ),
      key: "promo",
      status: "Offline",
      id: "flexSwitchCheckDefault4",
    },
  ]);

  // Services Query
  const {
    data: serviceData,
    loading: serviceLoading,
    refetch: refetchServices,
  } = useQuery(GET_ASTROLOGER_SERVICES, {
    variables: {
      astrologerId,
    },
    skip: !astrologerId,
    fetchPolicy: "network-only",
  });

  // Analytics Query
  const {
    data: analyticsData,
    loading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery(GetAstrologerAnalytics, {
    variables: {
      astrologerId,
    },
    skip: !astrologerId,
    fetchPolicy: "network-only",
  });

  const analytics = analyticsData?.getAstrologerAnalytics;

  const [toggleService, { loading: toggleLoading }] = useMutation(
    TOGGLE_ASTROLOGER_SERVICE,
  );

  useEffect(() => {
    if (!serviceData?.getAstrologerById) return;

    const astro = serviceData.getAstrologerById;

    setPanels((prev) =>
      prev.map((panel) => {
        switch (panel.key) {
          case "chat":
            return {
              ...panel,
              status: astro.isChatActive ? "Online" : "Offline",
            };

          case "call":
            return {
              ...panel,
              status: astro.isCallActive ? "Online" : "Offline",
            };

          case "live":
            return {
              ...panel,
              status: astro.isLiveActive ? "Online" : "Offline",
            };

          case "promo":
            return {
              ...panel,
              status: astro.isPromotional ? "Online" : "Offline",
            };

          default:
            return panel;
        }
      }),
    );
  }, [serviceData]);

  const handleToggle = async (index) => {
  const currentPanel = panels[index];

  const isTurningOn = currentPanel.status === "Offline";

  let updatedPanels = [...panels];

  // Live ON => Chat & Call OFF
  // if (currentPanel.key === "live" && isTurningOn) {
  //   updatedPanels = updatedPanels.map((panel) =>
  //     panel.key === "chat" || panel.key === "call"
  //       ? {
  //           ...panel,
  //           status: "Offline",
  //         }
  //       : panel
  //   );
  // }

  // Chat/Call ON => Live OFF
  // else if (
  //   (currentPanel.key === "chat" || currentPanel.key === "call") &&
  //   isTurningOn
  // ) {
  //   updatedPanels = updatedPanels.map((panel) =>
  //     panel.key === "live"
  //       ? {
  //           ...panel,
  //           status: "Offline",
  //         }
  //       : panel
  //   );
  // }

  updatedPanels[index] = {
    ...updatedPanels[index],
    status: isTurningOn ? "Online" : "Offline",
  };

  setPanels(updatedPanels);

  try {
    const { data } = await toggleService({
      variables: {
        astrologerId,
        serviceType: SERVICE_MAP[currentPanel.key],
        status: isTurningOn,
      },
    });

    toast.success(
      data?.toggleAstrologerService?.message || "Service Updated"
    );

    await Promise.all([
      refetchServices(),
      refetchAnalytics(),
    ]);
  } catch (error) {
    console.error(error);

    toast.error(
      error?.message || "Failed to update service"
    );

    await Promise.all([
      refetchServices(),
      refetchAnalytics(),
    ]);
  }
};

  if (serviceLoading || analyticsLoading) {
    return <div className="p-6 text-center">Loading... </div>;
  }

  return (
    <div
      className={`${styles.cardPanelPermi} shadow-lg rounded-2xl bg-white p-6`}
    >
      <h2 className={`${styles.walletHead} text-center`}>Manage Services </h2>

      {/* Analytics Cards */}

      {/* Services */}

      <div
        className={`${styles.astroMainSer} grid grid-cols-1 md:grid-cols-2 items-center flex-wrap justify-center md:justify-between`}
      >
        {panels.map((panel, index) => (
          <div
            key={panel.id}
            className={`${styles.panelAccessCard} flex justify-between`}
          >
            <div className={`${styles.manTop} flex justify-between w-full`}>
              <span
                className={`${styles.pAType} flex flex-col w-1/3 space-y-1`}
              >
                <span className={styles.pAType}>Type</span>

                <h3 className={styles.topGreet}>{panel.type}</h3>
              </span>

              <span className={`${styles.pAT} flex flex-col w-1/4`}>
                <span className={styles.pAType}>Status</span>

                <AntSwitch
                  checked={panel.status === "Online"}
                  onChange={() => handleToggle(index)}
                  disabled={toggleLoading}
                />
              </span>

              <div className="pt-4">
                <span
                  className={`${
                    panel.status === "Online" ? "bg-green-500" : "bg-red-500"
                  } text-white px-3 py-1 rounded-lg text-sm`}
                >
                  {panel.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageServices;
