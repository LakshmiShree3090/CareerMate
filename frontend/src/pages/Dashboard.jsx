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

function getDaysUntilInterview(interviewDate) {
  if (!interviewDate) {
    return null
  }

  const interviewDay = new Date(`${interviewDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.round((interviewDay - today) / 86400000)

  return daysUntil >= 0 && daysUntil <= 3 ? daysUntil : null
}

function getReminderLabel(daysUntil) {
  if (daysUntil === 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

function Dashboard() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [resumeFilename, setResumeFilename] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [popupInterviews, setPopupInterviews] = useState([])
  const hasToken = Boolean(localStorage.getItem('token'))

  useEffect(() => {
    if (!hasToken) {
      navigate('/login')
      return
    }

    async function loadApplications() {
      try {
        const response = await api.get('/api/applications')
        const loadedApplications = response.data.applications
        setApplications(loadedApplications)

        if (!sessionStorage.getItem('interviewReminderPopupShown')) {
          const upcomingPopupInterviews = loadedApplications
            .filter((application) => {
              const daysUntil = getDaysUntilInterview(application.interviewDate)
              return daysUntil !== null && daysUntil <= 2
            })
            .sort((first, second) => {
              const firstSchedule = `${first.interviewDate}T${first.interviewTime || '00:00'}`
              const secondSchedule = `${second.interviewDate}T${second.interviewTime || '00:00'}`
              return firstSchedule.localeCompare(secondSchedule)
            })

          if (upcomingPopupInterviews.length > 0) {
            setPopupInterviews(upcomingPopupInterviews)
            sessionStorage.setItem('interviewReminderPopupShown', 'true')
          }
        }
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

  const currentDate = new Date()
  const today = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, '0'),
    String(currentDate.getDate()).padStart(2, '0'),
  ].join('-')
  const upcomingInterviews = applications
    .filter((application) => application.interviewDate && application.interviewDate >= today)
    .sort((first, second) => {
      const firstSchedule = `${first.interviewDate}T${first.interviewTime || '00:00'}`
      const secondSchedule = `${second.interviewDate}T${second.interviewTime || '00:00'}`
      return firstSchedule.localeCompare(secondSchedule)
    })
  const interviewReminders = applications
    .map((application) => ({ application, daysUntil: getDaysUntilInterview(application.interviewDate) }))
    .filter((reminder) => reminder.daysUntil !== null)
    .sort(({ application: first }, { application: second }) => {
      const firstSchedule = `${first.interviewDate}T${first.interviewTime || '00:00'}`
      const secondSchedule = `${second.interviewDate}T${second.interviewTime || '00:00'}`
      return firstSchedule.localeCompare(secondSchedule)
    })

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

        <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-lg font-bold text-ink">Interview Reminders</h2>
          {interviewReminders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No upcoming interview reminders.</p>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {interviewReminders.map(({ application, daysUntil }) => (
                <article className="rounded-lg border border-blue-100 bg-white p-4" key={application._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{application.company} · {application.role}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {application.interviewDate}{application.interviewTime ? ` at ${application.interviewTime}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-primary">
                      {getReminderLabel(daysUntil)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {application.interviewMode || 'Mode not set'}{application.interviewLocation ? ` · ${application.interviewLocation}` : ' · Location not set'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-ink">Upcoming Interviews</h2>
          {upcomingInterviews.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No upcoming interviews.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-200">
              {upcomingInterviews.map((application) => (
                <article className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between" key={application._id}>
                  <div>
                    <p className="font-semibold text-ink">{application.company} · {application.role}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {application.interviewMode || 'Interview'}{application.interviewLocation ? ` · ${application.interviewLocation}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary">{application.interviewDate}{application.interviewTime ? ` at ${application.interviewTime}` : ''}</p>
                </article>
              ))}
            </div>
          )}
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

      {popupInterviews.length > 0 && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">CareerMate</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Interview Reminders</h2>
                <p className="mt-1 text-sm text-slate-600">You have upcoming interviews in the next two days.</p>
              </div>
              <button
                aria-label="Dismiss interview reminders"
                className="text-xl text-slate-500 hover:text-slate-800"
                onClick={() => setPopupInterviews([])}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {popupInterviews.map((application) => (
                <article className="rounded-lg border border-blue-100 bg-blue-50 p-4" key={application._id}>
                  <p className="font-semibold text-ink">{application.company} · {application.role}</p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Interview Date</dt>
                      <dd className="font-medium text-slate-700">{application.interviewDate}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Interview Time</dt>
                      <dd className="font-medium text-slate-700">{application.interviewTime || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Interview Mode</dt>
                      <dd className="font-medium text-slate-700">{application.interviewMode || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Interview Location</dt>
                      <dd className="font-medium text-slate-700">{application.interviewLocation || 'Not set'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Resume Used</dt>
                      <dd className="font-medium text-slate-700">{application.resumeFilename || 'No resume linked'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setPopupInterviews([])}
                type="button"
              >
                Dismiss
              </button>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                onClick={() => navigate('/applications')}
                type="button"
              >
                View Application
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Dashboard
