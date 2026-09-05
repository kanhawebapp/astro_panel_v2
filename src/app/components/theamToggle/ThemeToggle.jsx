// 'use client';

// import { useEffect, useState } from 'react';

// export default function ThemeToggle() {
//   const [theme, setTheme] = useState('light');

//   useEffect(() => {
//     const storedTheme = localStorage.getItem('theme') || 'light';
//     setTheme(storedTheme);
//     document.documentElement.classList.toggle('dark', storedTheme === 'dark');
//   }, []);

//   const toggleTheme = () => {
//     const newTheme = theme === 'dark' ? 'light' : 'dark';
//     setTheme(newTheme);
//     localStorage.setItem('theme', newTheme);
//     document.documentElement.classList.toggle('dark', newTheme === 'dark');
//   };

//   return (
//     <button
//       onClick={toggleTheme}
//       className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
//     >
//       {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
//     </button>
//   );
// }
