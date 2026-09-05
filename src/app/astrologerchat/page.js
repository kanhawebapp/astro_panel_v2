"use client";

import AstrologerChat from '@/component/chat/AstrologerChat';
import React, { Suspense } from 'react';



export default function page() {
  return (
    <div>
      <Suspense fallback={<div>Loading chat...</div>}>
        <AstrologerChat />
      </Suspense>
    </div>
  );
}
