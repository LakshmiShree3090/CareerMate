import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../services/api'

function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [applications, setApplications] = useState([])
  const [resumeFilename, setResumeFilename] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileResponse, applicationsResponse, resumeResponse] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/applications'),
          api.get('/api/resume'),
        ])

        setProfile(profileResponse.data)
        setApplications(applicationsResponse.data.applications)
        setResumeFilename(resumeResponse.data.filename || '')
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load profile')
      }
    }

    loadProfile()
  }, [])

  const statistics = [
    { label: 'Total Applications', value: applications.length, color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Pending Applications', value: applications.filter((application) => application.status?.toLowerCase() === 'pending').length, color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'Selected Applications', value: applications.filter((application) => application.status?.toLowerCase() === 'selected').length, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Rejected Applications', value: applications.filter((application) => application.status?.toLowerCase() === 'rejected').length, color: 'border-rose-200 bg-rose-50 text-rose-700' },
  ]

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-primary">CareerMate</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Profile</h1>
          <nav className="mt-4 flex gap-4 text-sm font-semibold text-primary">
            <Link className="hover:underline" to="/dashboard">Dashboard</Link>
            <Link className="hover:underline" to="/profile">Profile</Link>
          </nav>
        </header>

        {error && <p className="mt-5 text-sm text-rose-600">{error}</p>}

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-ink">Account Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">User Name</dt>
              <dd className="mt-1 font-medium text-ink">{profile.name || 'Not available'}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="mt-1 font-medium text-ink">{profile.email || 'Not available'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Current Resume Filename</dt>
              <dd className="mt-1 font-medium text-ink">{resumeFilename || 'No resume uploaded'}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((statistic) => (
            <article className={`rounded-lg border p-5 ${statistic.color}`} key={statistic.label}>
              <p className="text-sm font-medium">{statistic.label}</p>
              <p className="mt-4 text-3xl font-bold">{statistic.value}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default Profile
