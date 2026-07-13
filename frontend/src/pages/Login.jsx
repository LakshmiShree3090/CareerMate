import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthLayout from '../components/AuthLayout'
import api from '../services/api'

function Login() {
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const response = await api.post('/api/auth/login', {
        email: formData.get('email'),
        password: formData.get('password'),
      })

      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed')
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your job applications.">
      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
            type="email"
            placeholder="you@example.com"
            name="email"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
            type="password"
            placeholder="Enter your password"
            name="password"
            required
          />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700" type="submit">
          Login
        </button>
      </form>
      {location.state?.message && (
        <p className="mt-4 text-center text-sm text-emerald-600">{location.state.message}</p>
      )}
      {error && <p className="mt-4 text-center text-sm text-rose-600">{error}</p>}
      <p className="mt-6 text-center text-sm text-slate-600">
        New to CareerMate?{' '}
        <Link className="font-semibold text-primary hover:underline" to="/signup">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login
