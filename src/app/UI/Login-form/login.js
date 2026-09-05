// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Loader2 } from "lucide-react";

// export default function LoginForm() {
//   const [mobile, setMobile] = useState("9319490825");
//   const [password, setPassword] = useState("123456789");
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);

//     try {
//       const response = await fetch("/api/auth", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ mobile, password }),
//       });

//       let data;
//       const responseText = await response.text();
//       try {
//         data = JSON.parse(responseText);
//       } catch {
//         data = { message: responseText };
//       }

//       if (response.ok) {
//         router.push("/dashboard");
//       } else {
//         alert(`Login failed: ${data.message || "Invalid credentials."}`);
//       }
//     } catch (error) {
//       alert("Login error: Unable to connect to the server.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold text-center">Astrologer Login</h2>
//       <p className="text-center text-gray-500">Enter your credentials to sign in</p>
//       <form onSubmit={handleSubmit} className="space-y-4 mt-4">
//         <div>
//           <label className="block text-sm font-medium" htmlFor="mobile">Mobile Number</label>
//           <input
//             id="mobile"
//             type="text"
//             value={mobile}
//             onChange={(e) => setMobile(e.target.value)}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium" htmlFor="password">Password</label>
//           <input
//             id="password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//         <button
//           type="submit"
//           className="w-full p-2 bg-blue-600 text-white rounded"
//           disabled={isLoading}
//         >
//           {isLoading ? (
//             <>
//               <Loader2 className="inline-block animate-spin mr-2 h-4 w-4" />
//               Signing in...
//             </>
//           ) : (
//             "Sign in"
//           )}
//         </button>
//       </form>
//     </div>
//   );
// }




"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie"; // ✅ Import Cookies

export default function LoginForm() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set("token", data.access_token, { expires: 7 }); 
        router.push("/dashboard");
      } else {
        alert(`Login failed: ${data.message || "Invalid credentials."}`);
      }
    } catch (error) {
      alert("Login error: Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">Astrologer Login</h2>
      <p className="text-center text-gray-500">Enter your credentials to sign in</p>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="mobile">Mobile Number</label>
          <input
            id="mobile"
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="inline-block animate-spin mr-2 h-4 w-4" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}
