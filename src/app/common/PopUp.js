import React from 'react'
import { motion, AnimatePresence } from 'framer-motion';

function PopUp({title,subtitle,name,roomid,buttonname,buttontype}) {
  return (
    <AnimatePresence>
 <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              />

            {/* Modal box */}

              <motion.div
                className="fixed z-50 w-full max-w-sm p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg top-1/2 left-1/2 rounded-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h2 className="mb-3 text-xl font-bold">{title}</h2>
                <p className="mb-3 text-sm text-gray-600">
              {subtitle}
                </p>


                {
                  buttontype==1 && 
                  <button
                
                    className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                  >
                   {buttonname}
                  </button>
                }

                
            
              
              </motion.div>



          </>
        







      </AnimatePresence>
  )
}

export default PopUp
