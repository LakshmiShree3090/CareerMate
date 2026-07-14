import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
  })

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-primary">CareerMate</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Applications</h1>
            <Link className="mt-3 inline-block text-sm font-semibold text-primary hover:underline" to="/dashboard">
              Back to Dashboard
            </Link>
          </div>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            onClick={openAddModal}
            type="button"
          >
            Add Application
          </button>
        </header>

        {error && <p className="mt-5 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 sm:max-w-md"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by company or role"
            type="search"
            value={searchTerm}
          />
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="All">All</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
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
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredApplications.map((application) => (
                <tr key={application._id}>
                  <td className="px-5 py-4 font-medium text-ink">{application.company}</td>
                  <td className="px-5 py-4">{application.role}</td>
                  <td className="px-5 py-4">{application.status}</td>
                  <td className="px-5 py-4">{application.appliedDate}</td>
                  <td className="px-5 py-4">{application.resumeFilename || 'No resume linked'}</td>
                  <td className="px-5 py-4">
                    {application.interviewDate ? (
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="font-medium text-slate-800">{application.interviewDate}</p>
                        <p>{application.interviewTime || 'Time not set'}{application.interviewMode ? ` · ${application.interviewMode}` : ''}</p>
                        <p>{application.interviewLocation || 'Location not set'}</p>
                        {getInterviewReminderLabel(application.interviewDate) && (
                          <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-primary">
                            {getInterviewReminderLabel(application.interviewDate)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">No interview scheduled</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={() => setTimelineApplication(application)}
                        type="button"
                      >
                        Timeline
                      </button>
                      <button
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={() => openEditModal(application)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingId === application._id}
                        onClick={() => handleDelete(application._id)}
                        type="button"
                      >
                        {deletingId === application._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredApplications.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan="7">
                    {applications.length === 0 ? 'No applications yet.' : 'No matching applications found.'}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
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

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
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
              <fieldset className="border-t border-slate-200 pt-4">
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
              <div className="border-t border-slate-200 pt-4">
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
              <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                {isSaving ? 'Saving...' : 'Save Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {timelineApplication && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
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
                  <article className="relative" key={`${event.timestamp}-${index}`}>
                    <span className="absolute -left-[1.8rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-primary" />
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
