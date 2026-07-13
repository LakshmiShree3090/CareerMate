import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../services/api'
import ResumeSection from '../components/ResumeSection'

function Dashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const hasToken = Boolean(localStorage.getItem('token'))

  useEffect(() => {
    if (!hasToken) {
      navigate('/login')
      return
    }

    async function loadApplications() {
      try {
        const response = await api.get('/api/applications')
        setApplications(response.data.applications)
      } catch {
        setApplications([])
      }
    }

    loadApplications()

    window.addEventListener('applicationsUpdated', loadApplications)
    return () => window.removeEventListener('applicationsUpdated', loadApplications)
  }, [hasToken, navigate])

  const summaryCards = [
    { label: 'Total Applications', value: applications.length, color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Pending', value: applications.filter((application) => application.status?.toLowerCase() === 'pending').length, color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'Selected', value: applications.filter((application) => application.status?.toLowerCase() === 'selected').length, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Rejected', value: applications.filter((application) => application.status?.toLowerCase() === 'rejected').length, color: 'border-rose-200 bg-rose-50 text-rose-700' },
  ]

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (!hasToken) {
    return null
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-primary">CareerMate</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Welcome to CareerMate</h1>
            <p className="mt-2 text-slate-600">Track your job application progress at a glance.</p>
            <button
              className="mt-4 text-sm font-semibold text-primary hover:underline"
              onClick={() => navigate('/applications')}
              type="button"
            >
              View Applications
            </button>
          </div>
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article className={`rounded-lg border p-5 ${card.color}`} key={card.label}>
              <p className="text-sm font-medium">{card.label}</p>
              <p className="mt-4 text-3xl font-bold">{card.value}</p>
            </article>
          ))}
        </section>

        <ResumeSection />
      </div>
    </main>
  )
}

export default Dashboard
