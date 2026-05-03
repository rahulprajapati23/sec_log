import React from 'react'
import heroImage from '/HpEiFYDux5j.webp'

export default function FacebookPhoneMockup() {
  return (
    <div className="fb-phone-mockup">
      <img
        className="fb-hero-image"
        src={heroImage}
        alt="Facebook posts preview with photos, reactions, and avatar"
        loading="eager"
      />
    </div>
  )
}
