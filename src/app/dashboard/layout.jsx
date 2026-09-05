"use client";
import { useEffect } from "react";
import Navbar from "../components/navbar/Navbar";
import Sidebar from "../components/sidebar/Sidebar";
import TopBar from "../components/navbar2/TopBar";
import Footern from "../components/nfoooter/footer";
import ProtectedRoute from "../components/protectedRoute/ProtectedRoute";
import { SearchProvider } from "../../ContextAPi/SearchContext";
import ChatRequest from "@/component/ChatRequest";
import Calling from "@/component/chat/Calling";
import { usePathname } from "next/navigation";

// import SocketContext, { SocketProvider } from "@/component/SocketClient";




export default function RootLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    document.title = "Dashboard - Dhwani Astro";
  }, []);

  // List of route prefixes where TopBar should be hidden
  const hideTopBarRoutes = [
    "/dashboard/chathistory/view-chat",
    "/dashboard/earningdash",
    "/dashboard/offer",
    "/dashboard/setting",
    "/dashboard/chathistory/kundli/",

  ];
  const showTopBar = !hideTopBarRoutes.some(route => pathname?.startsWith(route));

  return (
    <ProtectedRoute>
      
        <SearchProvider>
          <div className="flex flex-col w-full min-h-screen ">
            <Navbar />

            <div className="flex flex-1 pt-[4.2rem] lg:pt-[4.8rem] ">
              <Sidebar />

              <div className="flex flex-col flex-1">
                {showTopBar && <TopBar className="z-998 " />}
                <main
                  className={`flex-1  md:mx-[2rem] ${showTopBar
                      ? 'mt-[4.2rem] lg:mt-[4rem]'
                      : 'mt-[.5rem] lg:mt-[.5rem]'
                    }`}
                >
                  {children}
                </main>
                {/* <CallStatusCard/> */}
                <ChatRequest />
                <Calling />

              </div>
            </div>

            <Footern />
          </div>
        </SearchProvider>
      
    </ProtectedRoute>
  );
}

