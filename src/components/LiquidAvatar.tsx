'use client';

import React, { useState } from 'react';

interface AvatarProps {
  id: string;
  name: string;
  role: 'doctor' | 'manager' | 'nurse';
  className?: string;
}

const MEMOJI_MAP: Record<string, string> = {
  u1: '/avatars/mraz.jpg?v=4',
  u2: '/avatars/srokova.jpg?v=2',
  u3: '/avatars/tran.jpg?v=2',
  u4: '/avatars/mecerodova.jpg?v=2',
  u5: '/avatars/solivajsova.jpg?v=2',
  u6: '/avatars/foltani.jpg?v=2',
  u7: '/avatars/lenhartova.jpg?v=2',
};

export function LiquidAvatar({ id, name, role, className = "w-full h-full" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const memojiSrc = MEMOJI_MAP[id] || '/avatars/mraz.jpg';

  if (!imgError) {
    return (
      <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-white ${className}`}>
        <img
          src={memojiSrc}
          alt={name}
          className="w-full h-full object-cover select-none pointer-events-none transform scale-105"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    );
  }

  // Fallback if image doesn't load: Stylized iOS Memoji Vector
  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-[#1C1A19] ${className}`}>
      <svg viewBox="0 0 140 140" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="70" cy="70" r="70" fill="#2C2A29" />
        <circle cx="70" cy="70" r="69" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <circle cx="70" cy="58" r="28" fill="#F8D6C3" />
        <ellipse cx="60" cy="56" rx="4" ry="5.5" fill="#2C2A29" />
        <ellipse cx="80" cy="56" rx="4" ry="5.5" fill="#2C2A29" />
        <circle cx="62" cy="54" r="1.8" fill="#FFFFFF" />
        <circle cx="82" cy="54" r="1.8" fill="#FFFFFF" />
        <path d="M62 70 C66 76, 74 76, 78 70" stroke="#A84C38" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
