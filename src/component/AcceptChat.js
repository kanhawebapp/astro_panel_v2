'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState,useContext } from 'react';
import SocketContext from './SocketClient';

const AcceptChat = ({accept}) => {

  const socket = useContext(SocketContext);

  return (
    <AnimatePresence>
      {accept && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReject}
          />

          {/* Modal box */}
        <motion.div
             className="fixed z-50 w-full max-w-sm p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg top-1/2 left-1/2 rounded-xl"
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
           >
             <h2 className="mb-3 text-xl font-bold">Chat : Please Wait ... </h2>
             
             {/* <p className='text-sm text-gray-800'>Name: {currentRequest.userName}</p>
             <p className='mb-6 text-sm text-gray-600'>Chat Id: {currentRequest.room_id}</p> */}
             <div className="flex justify-end gap-3">
               <button
                 onClick={handleReject}
                 className="px-4 py-2 text-red-700 bg-red-100 rounded hover:bg-red-200"
               >
                 Reject
               </button>
               <button
                 onClick={handleAccept}
                 className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
               >
                 Chat Accept
               </button>
             </div>
           </motion.div>

        
        
        </>
      )}
    </AnimatePresence>
  );
};

export default AcceptChat;
