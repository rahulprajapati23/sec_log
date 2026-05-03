import React from 'react'
import heroImage from '/53X3pk-t2Gn.webp'

export default function PhoneMockup() {
  return (
    <div className="phone-mockup">
      <img
        className="hero-image"
        src={heroImage}
        alt="Instagram stories preview with friends, reactions, and emojis"
        loading="eager"
      />
    </div>
  )
}
