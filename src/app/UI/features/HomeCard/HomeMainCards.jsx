"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";

import { GetAstrologerNotices } from "@/app/utils/panelQueries";
import { useGetdosAndDontApiQuery } from "@/app/redux/slice/doesDont";

const HomeMainCards = () => {
  const router = useRouter();

  const astroUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("astro_user") || "null")
      : null;

  const astrologerId = astroUser?.id;

  const {
    data: noticeData,
    loading: isNoticeLoading,
    error: noticeError,
  } = useQuery(GetAstrologerNotices, {
    variables: {
      astrologerId,
    },
    skip: !astrologerId,
    fetchPolicy: "network-only",
  });

  const {
    data: dosDontData,
    isLoading: isDosDontLoading,
    error: dosDontError,
  } = useGetdosAndDontApiQuery();

  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const notices = noticeData?.getAstrologerNotices || [];

  const todayNotices = notices.filter((notice) => isToday(notice.createdAt));

  const latestNotices = [...notices]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const cards = [
    {
      title: "Notice Board",

      content: (
        <>
          {isNoticeLoading ? (
            <p>Loading...</p>
          ) : noticeError ? (
            <p className="text-red-500">Failed to load notices.</p>
          ) : notices.length === 0 ? (
            <p className="text-gray-500">No notices available.</p>
          ) : (
            <div className="space-y-3">
              {todayNotices.length > 0
                ? todayNotices.slice(0, 1).map((notice) => (
                    <div key={notice.id}>
                      <div className="flex items-center gap-2">
                        {notice.isPinned && (
                          <span className="text-red-500">📌</span>
                        )}

                        <h4 className="font-semibold text-sm">
                          {notice.title}
                        </h4>
                      </div>

                      <p className="text-sm text-gray-700 mt-1">
                        {notice.description.length > 120
                          ? `${notice.description.slice(0, 120)}...`
                          : notice.description}
                      </p>

                      <small className="text-gray-500">
                        {/* {formatDateTime(notice.createdAt)} */}
                      </small>
                    </div>
                  ))
                : latestNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="border-b pb-2 last:border-b-0"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          {notice.isPinned && (
                            <span className="text-red-500">📌</span>
                          )}

                          <h4 className="font-semibold text-sm">
                            {notice.title}
                          </h4>
                        </div>

                        <small className="text-gray-500 whitespace-nowrap">
                          {/* {new Date(notice.createdAt).toLocaleDateString()} */}
                        </small>
                      </div>

                      <p className="text-sm text-gray-700 mt-1">
                        {notice.description.length > 80
                          ? `${notice.description.slice(0, 80)}...`
                          : notice.description}
                      </p>
                    </div>
                  ))}
            </div>
          )}
        </>
      ),

      button: {
        label: "View All",
        onClick: () => router.push("/dashboard/noticeBoard"),
      },
    },

    {
      title: "Do's and Don't",

  content: (
  <div className="text-sm">
    <p>
      1. Do not share your personal details, such as contact numbers or
      social media usernames, with any customer.
    </p>

    <p>
      2. You need to be available for a minimum of 6 hours every day.
    </p>

    <p>
      3. Always accept all calls and chats when you are online.
    </p>

    <p>
      4. Greet the customer with a proper welcome note like: “Welcome to
      Dhwani Astro,” or “Namaste, aapka swagat hai,” or whichever
      greeting you are comfortable with.
    </p>

    <p>
      5. Be respectful and polite to the customer in every manner.
    </p>

    <p>
      6. Do not speak rudely to any user, even if the user is
      misbehaving with you.
    </p>

    <p>
      7. Gender prediction is not provided to users; it is strictly
      illegal on Dhwani Astro.
    </p>

    <p>
      8. Practices like black magic, vashikaran, or suggesting such
      poojas using these yantras are FORBIDDEN on Dhwani Astro.
    </p>

    <b>
      *Note: If Dhwani Astro finds any policy being violated, strict
      action will be taken.*
    </b>

    <p>
      १. किसी भी ग्राहक के साथ अपना व्यक्तिगत विवरण, जैसे संपर्क नंबर या
      सोशल मीडिया यूज़रनेम साझा न करें।
    </p>

    <p>
      २. आपको हर दिन न्यूनतम ४ घंटे के लिए उपलब्ध होना चाहिए।
    </p>

    <p>
      ३. जब भी आप ऑनलाइन हों, सभी कॉल्स और चैट्स को हमेशा स्वीकार करें।
    </p>

    <p>
      ४. ग्राहक का उचित स्वागत नोट के साथ अभिवादन करें जैसे: "ध्वनि
      एस्ट्रो में आपका स्वागत है," या "नमस्ते, आपका स्वागत है," या जो भी
      अभिवादन आपको सुविधाजनक लगे।
    </p>

    <p>
      ५. हर तरह से ग्राहक के प्रति सम्मानजनक और विनम्र रहें।
    </p>

    <p>
      ६. किसी भी उपयोगकर्ता से अशिष्टता से बात न करें, भले ही वह आपके
      साथ दुर्व्यवहार कर रहा हो।
    </p>

    <p>
      ७. उपयोगकर्ताओं को लिंग भविष्यवाणी प्रदान नहीं की जाती है; यह
      ध्वनि एस्ट्रो पर सख्ती से अवैध है।
    </p>

    <p>
      ८. काले जादू, वशीकरण जैसे अभ्यास या इन यंत्रों का उपयोग करके ऐसे
      पूजाओं का सुझाव देना ध्वनि एस्ट्रो पर निषिद्ध है।
    </p>

    <p>
      *नोट: यदि ध्वनि एस्ट्रो को किसी भी नीति के उल्लंघन का पता चलता है,
      तो सख्त कार्रवाई की जाएगी।*
    </p>
  </div>
),

      button: {
        label: "View All",
        onClick: () => router.push("/dashboard/dosDonts"),
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-gradient-to-br h-85 from-purple-300 overflow-y-scroll to-purple-400 rounded-2xl shadow-lg p-6 transition-transform duration-300 hover:-translate-y-1"
        >
          <span className="text-xl font-bold text-purple-950 mb-3 block">
            {card.title}
          </span>

          <div className="text-base text-gray-800 leading-relaxed mb-4 min-h-35">
            {card.content}
            
   
          </div>

          <button
            onClick={card.button.onClick}
            className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition duration-200 flex place-self-center"
          >
            {card.button.label}
          </button>
        </div>
      ))}
    </div>
  );
};

export default HomeMainCards;
