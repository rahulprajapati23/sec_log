import React from 'react'

export default function MetaLogo() {
  return (
    <div className="meta-logo">
      <svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="22" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="400" letterSpacing="1">
          <tspan fill="currentColor" opacity="0.5">∞</tspan>
          <tspan fill="currentColor" opacity="0.5" dx="6">Meta</tspan>
        </text>
      </svg>
    </div>
  )
}
