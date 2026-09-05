const API_BASE_URL = "https://webdemonew.dhwaniastro.co.in/api/";
//  const API_BASE_URL="http://localhost:8000/api/";
const IMAGE_URL="https://webdemonew.dhwaniastro.co.in/cms-images/user-images/";
//for image  upload
const SENDER_IMG_URL = "https://websocket-service-user.onrender.com/uploads";
const RECEIVER_IMG_URL = "https://wbesocket-service.onrender.com/uploads";
export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};
export { IMAGE_URL, SENDER_IMG_URL, RECEIVER_IMG_URL };
export default API_BASE_URL;

