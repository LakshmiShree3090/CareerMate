import { useEffect, useState } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useNavigate } from 'react-router-dom'

import api from '../services/api'
import ResumeSection from '../components/ResumeSection'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function Dashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [resumeFilename, setResumeFilename] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
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

    async function loadResume() {
      try {
        const response = await api.get('/api/resume')
        setResumeFilename(response.data.filename || '')
      } catch {
        setResumeFilename('')
      }
    }

    loadResume()

    window.addEventListener('applicationsUpdated', loadApplications)
    return () => window.removeEventListener('applicationsUpdated', loadApplications)
  }, [hasToken, navigate])

  const summaryCards = [
    { label: 'Total Applications', value: applications.length, color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Pending', value: applications.filter((application) => application.status?.toLowerCase() === 'pending').length, color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'Selected', value: applications.filter((application) => application.status?.toLowerCase() === 'selected').length, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Rejected', value: applications.filter((application) => application.status?.toLowerCase() === 'rejected').length, color: 'border-rose-200 bg-rose-50 text-rose-700' },
  ]

  const chartData = {
    labels: ['Pending', 'Selected', 'Rejected'],
    datasets: [
      {
        label: 'Applications',
        data: [summaryCards[1].value, summaryCards[2].value, summaryCards[3].value],
        backgroundColor: ['#f59e0b', '#10b981', '#f43f5e'],
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Application Status',
      },
      legend: {
        display: false,
      },
    },
  }

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
          <div className="relative">
            <button
              aria-expanded={isProfileMenuOpen}
              aria-label="Profile menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white transition hover:bg-blue-700"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              P
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-11 z-10 w-32 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => navigate('/profile')}
                  type="button"
                >
                  Profile
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article className={`rounded-lg border p-5 ${card.color}`} key={card.label}>
              <p className="text-sm font-medium">{card.label}</p>
              <p className="mt-4 text-3xl font-bold">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 h-80 rounded-lg border border-slate-200 bg-white p-5">
          <Bar data={chartData} options={chartOptions} />
        </section>

        <ResumeSection />

        {resumeFilename && (
          <section className="mt-4 flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Resume Uploaded ✓</p>
              <p className="mt-2 text-sm text-slate-700">
                Current Resume: <span className="font-medium">{resumeFilename}</span>
              </p>
            </div>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              onClick={() => navigate('/resume-analysis')}
              type="button"
            >
              Analyze Resume
            </button>
          </section>
        )}
      </div>
    </main>
  )
}

export default Dashboard
