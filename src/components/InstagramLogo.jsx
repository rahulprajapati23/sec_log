import React from 'react'

export default function InstagramLogo({ className }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="12" stroke="url(#ig-gradient)" strokeWidth="3.5" fill="none" />
        <circle cx="24" cy="24" r="10" stroke="url(#ig-gradient)" strokeWidth="3.5" fill="none" />
        <circle cx="36" cy="12" r="2.5" fill="url(#ig-gradient)" />
      </svg>
    </div>
  )
}
