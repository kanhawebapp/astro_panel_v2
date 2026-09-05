import "./globals.css";
import { Providers } from "./redux/provider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SocketProvider } from "@/component/SocketClient";
import ApolloWrapper from "@/providers/ApolloWrapper";

export const metadata = {
  title: "Login - Dhwani Astro",
  description: "Securely log in to your Dhwani Astro account.",
  openGraph: {
    title: "Login - Dhwani Astro",
    description: "Securely log in to your Dhwani Astro account.",
    url: "https://astro.dhwaniastro.com/",
    siteName: "Dhwani Astro",
    images: [
      {
        url: "https://shop.dhwaniastro.com/cdn/shop/files/logo.png?height=628&pad_color=ffffff&v=1704542290&width=1200",
        width: 1200,
        height: 630,
        alt: "Dhwani Astro Login Page",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login - Dhwani Astro",
    description: "Securely log in to your Dhwani Astro account.",
    images: [
      "https://shop.dhwaniastro.com/cdn/shop/files/logo.png?height=628&pad_color=ffffff&v=1704542290&width=1200",
    ],
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <ApolloWrapper>
            <SocketProvider>
              {children}
              <ToastContainer position="top-center" autoClose={2000} />
            </SocketProvider>
          </ApolloWrapper>
        </Providers>
      </body>
    </html>
  );
}
