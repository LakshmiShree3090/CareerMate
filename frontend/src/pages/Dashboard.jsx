import { useEffect, useState } from 'react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useNavigate } from 'react-router-dom'

import api from '../services/api'

ChartJS.register(ArcElement, Tooltip, Legend)

function getDaysUntilInterview(interviewDate) {
  if (!interviewDate) return null

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
  const [userName, setUserName] = useState('there')
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
            .sort((first, second) => `${first.interviewDate}T${first.interviewTime || '00:00'}`.localeCompare(`${second.interviewDate}T${second.interviewTime || '00:00'}`))

          if (upcomingPopupInterviews.length > 0) {
            setPopupInterviews(upcomingPopupInterviews)
            sessionStorage.setItem('interviewReminderPopupShown', 'true')
          }
        }
      } catch {
        setApplications([])
      }
    }

    async function loadResume() {
      try {
        const response = await api.get('/api/resume')
        setResumeFilename(response.data.filename || '')
      } catch {
        setResumeFilename('')
      }
    }

    async function loadUser() {
      try {
        const response = await api.get('/api/auth/me')
        setUserName(response.data.name || 'there')
      } catch {
        setUserName('there')
      }
    }

    loadApplications()
    loadResume()
    loadUser()
    window.addEventListener('applicationsUpdated', loadApplications)
    return () => window.removeEventListener('applicationsUpdated', loadApplications)
  }, [hasToken, navigate])

  const currentDate = new Date()
  const today = [currentDate.getFullYear(), String(currentDate.getMonth() + 1).padStart(2, '0'), String(currentDate.getDate()).padStart(2, '0')].join('-')
  const formattedToday = currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const pendingCount = applications.filter((application) => application.status?.toLowerCase() === 'pending').length
  const selectedCount = applications.filter((application) => application.status?.toLowerCase() === 'selected').length
  const rejectedCount = applications.filter((application) => application.status?.toLowerCase() === 'rejected').length
  const upcomingInterviews = applications
    .filter((application) => application.interviewDate && application.interviewDate >= today)
    .sort((first, second) => `${first.interviewDate}T${first.interviewTime || '00:00'}`.localeCompare(`${second.interviewDate}T${second.interviewTime || '00:00'}`))
  const nextInterview = upcomingInterviews[0]
  const recentApplications = [...applications]
    .sort((first, second) => `${second.appliedDate || ''}`.localeCompare(`${first.appliedDate || ''}`))
    .slice(0, 5)

  const summaryCards = [
    { label: 'Applications', value: applications.length, subtitle: 'Roles you are tracking', icon: '▦', iconClass: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: pendingCount, subtitle: 'Awaiting an update', icon: '◷', iconClass: 'bg-amber-50 text-amber-600' },
    { label: 'Selected', value: selectedCount, subtitle: 'Positive outcomes', icon: '↗', iconClass: 'bg-emerald-50 text-emerald-600' },
    { label: 'Rejected', value: rejectedCount, subtitle: 'Closed applications', icon: '×', iconClass: 'bg-rose-50 text-rose-600' },
  ]

  const chartData = {
    labels: ['Pending', 'Selected', 'Rejected'],
    datasets: [{
      data: [pendingCount, selectedCount, rejectedCount],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
      borderColor: '#ffffff',
      borderWidth: 5,
      hoverOffset: 5,
    }],
  }
  const chartOptions = {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 9, boxHeight: 9, usePointStyle: true, pointStyle: 'circle', color: '#64748b', padding: 16, font: { family: 'Inter', size: 12 } } },
      tooltip: { displayColors: false, backgroundColor: '#0f172a', padding: 10 },
    },
  }

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (!hasToken) return null

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="cm-dashboard-hero relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-7 text-white shadow-2xl shadow-blue-950/20 backdrop-blur sm:p-9">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-200/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-blue-100">{formattedToday}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {userName}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">Track every application. Never lose a resume version.</p>
              <button className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50" onClick={() => navigate('/applications')} type="button">View Applications <span aria-hidden="true">→</span></button>
            </div>
            <div className="relative shrink-0">
              <button aria-expanded={isProfileMenuOpen} aria-label="Profile menu" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25" onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)} type="button">{userName.charAt(0).toUpperCase()}</button>
              {isProfileMenuOpen && <div className="absolute right-0 top-14 z-10 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 text-slate-700 shadow-xl"><button className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50" onClick={() => navigate('/profile')} type="button">Profile</button><button className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50" onClick={handleLogout} type="button">Logout</button></div>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-lg shadow-slate-900/5 backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-xl" key={card.label}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold text-slate-600">{card.label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-ink">{card.value}</p></div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-semibold ${card.iconClass}`}>{card.icon}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{card.subtitle}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <article className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
            <p className="text-sm font-semibold text-primary">Overview</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Application Progress</h2>
            <div className="mt-5 h-52"><Doughnut data={chartData} options={chartOptions} /></div>
          </article>

          <article className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Stay prepared</p><h2 className="mt-1 text-xl font-bold text-ink">Next Interview</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-lg text-primary">◷</span></div>
            {nextInterview ? (
              <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div><p className="text-lg font-bold text-ink">{nextInterview.company}</p><p className="mt-1 text-sm text-slate-600">{nextInterview.role}</p><p className="mt-4 text-sm font-medium text-slate-700">{nextInterview.interviewDate} {nextInterview.interviewTime ? `· ${nextInterview.interviewTime}` : ''}</p></div>
                <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700" onClick={() => navigate('/applications')} type="button">View Interview</button>
              </div>
            ) : <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">No upcoming interviews</p>}
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <article className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Your pipeline</p><h2 className="mt-1 text-xl font-bold text-ink">Recent Applications</h2></div><button className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-blue-100" onClick={() => navigate('/applications')} type="button">View All</button></div>
            {recentApplications.length === 0 ? <p className="mt-6 text-sm text-slate-500">No applications yet.</p> : (
              <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3 font-semibold">Company</th><th className="pb-3 font-semibold">Role</th><th className="pb-3 text-right font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{recentApplications.map((application) => <tr key={application._id}><td className="py-3 font-semibold text-ink">{application.company}</td><td className="py-3 text-slate-600">{application.role}</td><td className="py-3 text-right"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{application.status}</span></td></tr>)}</tbody></table></div>
            )}
          </article>

          <article className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
            <div className="flex h-full flex-col"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-secondary">✦</span><p className="mt-5 text-sm font-semibold text-primary">Keep improving</p><h2 className="mt-1 text-xl font-bold text-ink">Resume Intelligence</h2><div className="mt-5 rounded-2xl border border-slate-100 bg-white/80 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Resume</p><p className="mt-2 truncate text-sm font-semibold text-ink">{resumeFilename || 'No resume uploaded'}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Resume Score</p><p className="mt-2 text-sm text-slate-600">Available in Resume Analysis</p></div><button className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700" onClick={() => navigate('/resume-analysis')} type="button">Open Resume Analysis</button></div>
          </article>
        </section>
      </div>

      {popupInterviews.length > 0 && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/70 bg-white/95 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl shadow-lg shadow-blue-200 animate-[cm-alert-bell_1.8s_ease-in-out_infinite]">🔔</span><div><p className="text-sm font-semibold text-primary">CareerMate</p><h2 className="text-2xl font-bold text-ink">Interview Alerts</h2></div></div><p className="mt-3 text-sm text-slate-600">You have {popupInterviews.length} upcoming interview{popupInterviews.length === 1 ? '' : 's'}.</p></div><button aria-label="Dismiss interview reminders" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200" onClick={() => setPopupInterviews([])} type="button">×</button></div>
            <div className="mt-6 space-y-4">{popupInterviews.map((application) => <article className="rounded-2xl border border-blue-100 border-l-4 border-l-primary bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-lg shadow-blue-950/5" key={application._id} style={{ animation: 'cm-reminder-pulse 3s ease-in-out infinite' }}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="text-lg font-bold text-ink">{application.company}</h3><p className="mt-1 text-sm font-medium text-slate-600">{application.role}</p></div><span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-blue-200">{getReminderLabel(getDaysUntilInterview(application.interviewDate))}</span></div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700"><span className="inline-flex items-center gap-2">◷ {application.interviewTime || 'Time not set'}</span><span className="inline-flex items-center gap-2">▣ {application.interviewMode || 'Mode not set'}</span></div><button className="mt-5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700" onClick={() => navigate('/applications')} type="button">View Application</button></article>)}</div>
            <div className="mt-6 flex justify-end"><button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setPopupInterviews([])} type="button">Dismiss</button></div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Dashboard
