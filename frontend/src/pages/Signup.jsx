import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AuthLayout from '../components/AuthLayout'
import api from '../services/api'

function Signup() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      const response = await api.post('/api/auth/signup', {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
      })

      setMessage(response.data.message)
      setError('')
      navigate('/login', { state: { message: response.data.message } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Signup failed')
      setMessage('')
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start organizing your job search in one place.">
      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
            type="text"
            placeholder="Your name"
            name="name"
            required
          />
        </label>
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
            placeholder="Create a password"
            name="password"
            required
          />
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700" type="submit">
          Signup
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-4 text-center text-sm text-rose-600">{error}</p>}
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="font-semibold text-primary hover:underline" to="/login">
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Signup
