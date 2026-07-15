import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../services/api'

function getInterviewReminderLabel(interviewDate) {
  if (!interviewDate) {
    return ''
  }

  const interviewDay = new Date(`${interviewDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.round((interviewDay - today) / 86400000)

  if (daysUntil === 0) return 'Today'
  if (daysUntil === 1) return 'Tomorrow'
  if (daysUntil === 2) return '2 Days Left'
  if (daysUntil === 3) return '3 Days Left'

  return ''
}

function Applications() {
  const [applications, setApplications] = useState([])
  const [resumeOptions, setResumeOptions] = useState([])
  const [selectedResumeStoredFilename, setSelectedResumeStoredFilename] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('Newest')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
  const [timelineApplication, setTimelineApplication] = useState(null)
  const navigate = useNavigate()
  const hasToken = Boolean(localStorage.getItem('token'))

  async function loadApplications() {
    setIsLoading(true)

    try {
      const response = await api.get('/api/applications')
      setApplications(response.data.applications)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load applications')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadResumeOptions() {
    try {
      const response = await api.get('/api/application-resumes')
      setResumeOptions(response.data.resumes)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load resumes')
    }
  }

  function notifyApplicationsChanged() {
    window.dispatchEvent(new Event('applicationsUpdated'))
  }

  useEffect(() => {
    if (!hasToken) {
      navigate('/login')
      return
    }

    loadApplications()
    loadResumeOptions()
  }, [hasToken, navigate])

  function openAddModal() {
    setEditingApplication(null)
    setSelectedResumeStoredFilename(resumeOptions[0]?.storedFilename || '')
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(application) {
    setEditingApplication(application)
    setSelectedResumeStoredFilename(application.resumeStoredFilename || '')
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (!isSaving) {
      setIsModalOpen(false)
    }
  }

  async function previewResume(event, application) {
    event.preventDefault()

    const previewTab = window.open('', '_blank')
    if (!previewTab) {
      return
    }

    try {
      const response = await api.get(
        `/api/application-resumes/${encodeURIComponent(application.resumeStoredFilename)}`,
        { responseType: 'blob' },
      )
      const resumeUrl = URL.createObjectURL(response.data)

      previewTab.location.href = resumeUrl
      window.setTimeout(() => URL.revokeObjectURL(resumeUrl), 60000)
    } catch (requestError) {
      previewTab.close()
      setError(requestError.response?.data?.message || 'Could not open resume')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const resumeFile = formData.get('resume')
    let selectedResume = resumeOptions.find(
      (resume) => resume.storedFilename === selectedResumeStoredFilename,
    )

    if (resumeFile?.name) {
      const uploadData = new FormData()
      uploadData.append('resume', resumeFile)

      try {
        const response = await api.post('/api/application-resumes/upload', uploadData)
        selectedResume = response.data.resume
        setResumeOptions((currentResumes) => [...currentResumes, selectedResume])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not upload resume')
        return
      }
    }

    if (!selectedResume) {
      setError('Select or upload a resume for this application')
      return
    }

    const applicationData = {
      company: formData.get('company'),
      role: formData.get('role'),
      status: formData.get('status'),
      appliedDate: formData.get('appliedDate'),
      resumeFilename: selectedResume.filename,
      resumeStoredFilename: selectedResume.storedFilename,
      interviewDate: formData.get('interviewDate'),
      interviewTime: formData.get('interviewTime'),
      interviewMode: formData.get('interviewMode'),
      interviewLocation: formData.get('interviewLocation'),
      interviewNotes: formData.get('interviewNotes'),
    }

    setIsSaving(true)

    try {
      if (editingApplication) {
        const response = await api.put(`/api/applications/${editingApplication._id}`, applicationData)
        setApplications((currentApplications) =>
          currentApplications.map((application) =>
            application._id === editingApplication._id
              ? { ...application, ...applicationData, timeline: response.data.timeline }
              : application,
          ),
        )
      } else {
        await api.post('/api/applications', applicationData)
        await loadApplications()
      }

      setIsModalOpen(false)
      notifyApplicationsChanged()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Could not save application',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(applicationId) {
    const shouldDelete = window.confirm('Delete this application?')

    if (!shouldDelete) {
      return
    }

    setDeletingId(applicationId)
    setError('')

    try {
      await api.delete(`/api/applications/${applicationId}`)
      setApplications((currentApplications) =>
        currentApplications.filter((application) => application._id !== applicationId),
      )
      notifyApplicationsChanged()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete application')
    } finally {
      setDeletingId('')
    }
  }

  if (!hasToken) {
    return null
  }

  const filteredApplications = applications.filter((application) => {
    const searchText = searchTerm.toLowerCase()
    const matchesSearch =
      application.company.toLowerCase().includes(searchText) ||
      application.role.toLowerCase().includes(searchText)
    const matchesStatus =
      statusFilter === 'All' || application.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  }).sort((first, second) => {
    const firstDate = new Date(`${first.appliedDate || '1970-01-01'}T00:00:00`)
    const secondDate = new Date(`${second.appliedDate || '1970-01-01'}T00:00:00`)
    return sortOrder === 'Oldest' ? firstDate - secondDate : secondDate - firstDate
  })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-start justify-between gap-4 rounded-3xl border border-white/80 bg-white/70 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
          <div>
            <p className="text-sm font-semibold text-primary">CareerMate</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Applications</h1>
            <p className="mt-3 text-sm text-slate-600">Track every application, resume version and interview from one place.</p>
          </div>
          <button
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
            onClick={openAddModal}
            type="button"
          >
            + Add Application
          </button>
        </header>

        {error && <p className="mt-5 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-lg shadow-slate-900/5 backdrop-blur lg:flex-row lg:items-center">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 lg:max-w-md"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by company or role"
            type="search"
            value={searchTerm}
          />
          <select
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" onChange={(event) => setSortOrder(event.target.value)} value={sortOrder}>
            <option value="Newest">Newest first</option>
            <option value="Oldest">Oldest first</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-white/80 bg-white/75 p-2 shadow-xl shadow-slate-900/5 backdrop-blur">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Applied Date</th>
                <th className="px-5 py-3 font-semibold">Resume</th>
                <th className="px-5 py-3 font-semibold">Interview Scheduled</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {filteredApplications.map((application) => (
                <tr className="border-b border-slate-100 last:border-0 odd:bg-slate-50/35 transition hover:bg-blue-50/60" key={application._id}>
                  <td className="px-5 py-4 font-semibold text-ink">{application.company}</td>
                  <td className="px-5 py-4">{application.role}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${application.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' : application.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : application.status === 'Interview' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{application.status}</span></td>
                  <td className="px-5 py-4 text-slate-600">{application.appliedDate}</td>
                  <td className="px-5 py-4">
                    {application.resumeFilename && application.resumeStoredFilename ? (
                      <a
                        className="inline-flex items-center gap-1.5 text-primary hover:cursor-pointer hover:underline"
                        href="#"
                        onClick={(event) => previewResume(event, application)}
                        target="_blank"
                      >
                        <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6M8 13h8M8 17h6" />
                        </svg>
                        {application.resumeFilename}
                      </a>
                    ) : (
                      <span className="text-slate-500">No Resume</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {application.interviewDate ? (
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">📅 {application.interviewDate}</p>
                        <p>⏰ {application.interviewTime || 'Time not set'}</p>
                        <p>📍 {application.interviewMode || application.interviewLocation || 'Mode not set'}</p>
                        {getInterviewReminderLabel(application.interviewDate) && (
                          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-primary">
                            {getInterviewReminderLabel(application.interviewDate)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">No interview scheduled</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        aria-label="View timeline" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-primary" title="Timeline"
                        onClick={() => setTimelineApplication(application)}
                        type="button"
                      >
                        ◷
                      </button>
                      <button
                        aria-label="Edit application" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-primary" title="Edit"
                        onClick={() => openEditModal(application)}
                        type="button"
                      >
                        ✎
                      </button>
                      <button
                        aria-label="Delete application" className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60" title="Delete"
                        disabled={deletingId === application._id}
                        onClick={() => handleDelete(application._id)}
                        type="button"
                      >
                        {deletingId === application._id ? '…' : '⌫'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredApplications.length === 0 && (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan="7">
                    {applications.length === 0 ? <div><p className="text-4xl">◌</p><p className="mt-3 text-lg font-bold text-ink">No applications yet</p><p className="mt-1 text-sm">Start tracking your next opportunity.</p><button className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700" onClick={openAddModal} type="button">+ Add Application</button></div> : 'No matching applications found.'}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan="7">
                    Loading applications...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 p-6 backdrop-blur">
              <h2 className="text-xl font-bold text-ink">
                {editingApplication ? 'Edit Application' : 'Add Application'}
              </h2>
              <button
                aria-label="Close"
                className="text-xl text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={closeModal}
                type="button"
              >
                x
              </button>
            </div>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
              <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Company
                <input className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.company} name="company" required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Role
                <input className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.role} name="role" required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.status || 'Pending'} name="status" required>
                  <option value="Pending">Pending</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Applied Date
                <input className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.appliedDate} name="appliedDate" type="date" required />
              </label>
              <fieldset className="border-t border-slate-200 pt-4 sm:col-span-2">
                <legend className="text-sm font-semibold text-slate-700">Interview Details <span className="font-normal text-slate-500">(optional)</span></legend>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Interview Date
                    <input className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.interviewDate || ''} name="interviewDate" type="date" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Interview Time
                    <input className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.interviewTime || ''} name="interviewTime" type="time" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Interview Mode
                    <select className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.interviewMode || ''} name="interviewMode">
                      <option value="">Select mode</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Interview Location
                    <input className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.interviewLocation || ''} name="interviewLocation" placeholder="Meeting link or address" />
                  </label>
                </div>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Interview Notes
                  <textarea className="mt-1.5 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" defaultValue={editingApplication?.interviewNotes || ''} name="interviewNotes" placeholder="Optional preparation notes" />
                </label>
              </fieldset>
              <div className="border-t border-slate-200 pt-4 sm:col-span-2">
                <p className="text-sm font-medium text-slate-700">Resume</p>
                <select
                  className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => setSelectedResumeStoredFilename(event.target.value)}
                  value={selectedResumeStoredFilename}
                >
                  <option value="">Select an uploaded resume</option>
                  {resumeOptions.map((resume) => (
                    <option key={resume.storedFilename} value={resume.storedFilename}>
                      {resume.filename}
                    </option>
                  ))}
                </select>
                <label className="mt-3 block text-sm text-slate-600">
                  Upload a new PDF or DOCX resume
                  <input
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                    name="resume"
                    type="file"
                  />
                </label>
              </div>
              </div>
              <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 p-5 backdrop-blur">
              <button className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                {isSaving ? 'Saving...' : 'Save Application'}
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {timelineApplication && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">Application Timeline</h2>
                <p className="mt-1 text-sm text-slate-600">{timelineApplication.company} · {timelineApplication.role}</p>
              </div>
              <button
                aria-label="Close timeline"
                className="text-xl text-slate-500 hover:text-slate-800"
                onClick={() => setTimelineApplication(null)}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-6 space-y-5 border-l-2 border-blue-100 pl-5">
              {[...(timelineApplication.timeline || [])]
                .sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp))
                .map((event, index) => (
                  <article className="relative rounded-2xl border border-blue-50 bg-blue-50/40 p-4 shadow-sm" key={`${event.timestamp}-${index}`}>
                    <span className="absolute -left-[1.8rem] top-5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-primary text-[8px] text-white">✓</span>
                    <p className="font-semibold text-ink">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                    {event.description && <p className="mt-2 text-sm text-slate-600">{event.description}</p>}
                  </article>
                ))}
              {(timelineApplication.timeline || []).length === 0 && (
                <p className="text-sm text-slate-500">No timeline events are available for this application.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Applications
