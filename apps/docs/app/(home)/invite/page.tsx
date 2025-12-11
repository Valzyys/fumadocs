'use client';

import { useEffect } from 'react';

export default function DiscordRedirect() {
  useEffect(() => {
    // Redirect langsung saat komponen di-mount
    window.location.href = 'https://discord.com/oauth2/authorize?client_id=1305141693477027891&permissions=8&integration_type=0&scope=bot';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Discord...</p>
      </div>
    </div>
  );
}
