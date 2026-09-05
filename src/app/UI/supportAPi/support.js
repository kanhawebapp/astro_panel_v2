"use client";
import { useEffect } from "react";

export default function SupportChat() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://embed.tawk.to/62d51cfeb0d10b6f3e7cdad2/1g887ih9a";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="tawk-container"></div>; 
}



// import { useEffect, useRef } from "react";

// export default function SupportChat() {
//   const chatContainerRef = useRef(null);

//   useEffect(() => {
//     const script = document.createElement("script");
//     script.type = "text/javascript";
//     script.async = true;
//     script.src = "https://embed.tawk.to/62d51cfeb0d10b6f3e7cdad2/1g887ih9a";
//     script.charset = "UTF-8";
//     script.setAttribute("crossorigin", "*");

//     // Append script inside custom div, not document.body
//     if (chatContainerRef.current) {
//       chatContainerRef.current.appendChild(script);
//     }

//     return () => {
//       if (chatContainerRef.current) {
//         chatContainerRef.current.innerHTML = "";
//       }
//     };
//   }, []);

//   return (
//     <div
//       id="tawk-container"
//       ref={chatContainerRef}
//       style={{
//         position: "fixed", // or "absolute" if you want relative to parent
//         bottom: "80px",    // space above footer
//         right: "20px",
//         zIndex: 9999,      // keep on top of other components
//         maxWidth: "90vw",
//         overflow: "hidden",
//       }}
//     />
//   );
// }

