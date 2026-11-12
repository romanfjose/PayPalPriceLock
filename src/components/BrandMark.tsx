"use client";

import React from "react";

export function PriceLockLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pl-tile-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0A192F" />
          <stop offset="55%" stopColor="#0B2545" />
          <stop offset="100%" stopColor="#06373A" />
        </linearGradient>
        <linearGradient id="pl-shield-stroke" x1="8" y1="7" x2="32" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="pl-lock-fill" x1="14" y1="16" x2="26" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {/* Squircle App Tile */}
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#pl-tile-bg)" />
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="10.5"
        stroke="white"
        strokeOpacity="0.14"
      />

      {/* Precision Shield + Price-Tag Chamfer Silhouette */}
      <path
        d="M20 6.5L30.5 11.2V20.2C30.5 26.8 25.9 31.8 20 33.8C14.1 31.8 9.5 26.8 9.5 20.2V11.2L20 6.5Z"
        fill="#0F2942"
        fillOpacity="0.65"
        stroke="url(#pl-shield-stroke)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Shackle */}
      <path
        d="M16.2 18V15.3C16.2 13.2 17.9 11.5 20 11.5C22.1 11.5 23.8 13.2 23.8 15.3V18"
        stroke="#F8FAFC"
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      {/* Vault Lock Body */}
      <rect x="13.8" y="17.8" width="12.4" height="10" rx="2.8" fill="url(#pl-lock-fill)" />

      {/* Downward Price-Floor Check Chevron inside Lock */}
      <path
        d="M17.4 22.6L19.3 24.5L23 20.8"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PayPalWordmarkBadge({ mode }: { mode?: string }) {
  const isLive = !mode || mode === "LIVE_SANDBOX";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pl-border)] bg-[var(--pl-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pl-ink-secondary)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7.2 20.5H4.4C3.9 20.5 3.5 20.1 3.6 19.6L6.1 4.2C6.2 3.7 6.6 3.4 7.1 3.4H14.1C17.6 3.4 19.8 5.2 19.3 8.5C18.8 11.7 16.3 13.5 12.6 13.5H9.3L8.2 19.8C8.1 20.2 7.7 20.5 7.2 20.5Z"
          fill="#003087"
          className="dark:fill-[#38BDF8]"
        />
        <path
          d="M10.4 22H7.9C7.5 22 7.2 21.6 7.3 21.2L9.2 9.4C9.3 9 9.6 8.7 10 8.7H15.6C18.5 8.7 20.3 10.2 19.9 12.9C19.5 15.6 17.4 17.1 14.3 17.1H11.8L11.1 21.4C11 21.8 10.7 22 10.4 22Z"
          fill="#0070E0"
          fillOpacity="0.88"
        />
      </svg>
      <span>PayPal Orders v2</span>
      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {isLive ? "LIVE" : "READY"}
      </span>
    </span>
  );
}

export function ShieldIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        d="M10 2.5L16.5 5.4V10.4C16.5 14.3 13.7 17.2 10 18.4C6.3 17.2 3.5 14.3 3.5 10.4V5.4L10 2.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 10.2L9.3 12L12.8 8.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GridStudioIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="6" height="6" rx="1.4" />
      <rect x="11" y="3" width="6" height="6" rx="1.4" />
      <rect x="3" y="11" width="6" height="6" rx="1.4" />
      <rect x="11" y="11" width="6" height="6" rx="1.4" />
    </svg>
  );
}

export function BoltRaceIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M11 2.5L4.5 11H10L9 17.5L15.5 9H10L11 2.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KeyProofIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 11L16.5 3.5M16.5 3.5H13M16.5 3.5V7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="13.5" r="3.5" />
    </svg>
  );
}
