





const CHAT_MicroApi="http://localhost:8001/api/"


export const LOCAL_STORAGE_KEY = {
  ACCESS_TOKEN: 'accessToken',
  USER_ID: 'USER',
};

export const API_END_POINT = () => {
  if (typeof window === 'undefined') return {};

  const userId = localStorage.getItem(LOCAL_STORAGE_KEY.USER_ID);


  return {
    CHAT_HISTORY: `${CHAT_MicroApi}chat/history`,
   ASTRO_REVIEW: `astro-reviews`,
    CHAT_HISTORY: `expertchathistory?expert_id=${userId}`,
    CALL_HISTORY: `call-history?user_id=${userId}`,
    STORE_HISTORY: `get-expert-order?astrologer_id=${userId}`,
    GET_REVIEW: `astro-reviews?to_experts=${userId}`,
    DO_DONT: `dosdont`,
    NOTICES: `notices`,
    LIVE_EVENT: `get-webinar-session`,
    PRICE_REQUEST: `astro-prices`,
    MY_FOLLOWER: `my-clients`,
    ASTRO_PROFILE: `expert-all-details?user_id=${userId}`,
    REMEDY: `get-suggestion?astro_id=${userId}`,
    WALLET: `expert-earning-history`,
    IMPORTANT_CONTACT: `import_astro_contact`,
    CALL_STATUS : `call-pending-history?user_id=${userId}`,
    LIVE_CHAT: `/api/chat/live`,
    OFFER_PRICE: `expert-offerprice?expert_id=${userId}`,
  };
};


