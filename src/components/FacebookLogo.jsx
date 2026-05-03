import React from 'react'

export default function FacebookLogo({ className }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#1877f2" />
        <path
          d="M33.12 30.94l1.06-6.94H27.5v-4.5c0-1.9.93-3.75 3.91-3.75H34.5V10.3s-2.56-.44-5.01-.44c-5.11 0-8.45 3.1-8.45 8.7V24h-5.68v6.94h5.68V48.7a22.42 22.42 0 006.92 0V30.94h5.16z"
          fill="white"
        />
      </svg>
    </div>
  )
}
