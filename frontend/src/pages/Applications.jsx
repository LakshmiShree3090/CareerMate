import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import api from '../services/api'

function Applications() {
  const [applications, setApplications] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
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

  function notifyApplicationsChanged() {
    window.dispatchEvent(new Event('applicationsUpdated'))
  }

  useEffect(() => {
    if (!hasToken) {
      navigate('/login')
      return
    }

    loadApplications()
  }, [hasToken, navigate])

  function openAddModal() {
    setEditingApplication(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(application) {
    setEditingApplication(application)
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
    const applicationData = {
      company: formData.get('company'),
      role: formData.get('role'),
      status: formData.get('status'),
      appliedDate: formData.get('appliedDate'),
    }

    setIsSaving(true)

    try {
      if (editingApplication) {
        await api.put(`/api/applications/${editingApplication._id}`, applicationData)
        setApplications((currentApplications) =>
          currentApplications.map((application) =>
            application._id === editingApplication._id
              ? { ...application, ...applicationData }
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Applied Date</th>
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
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
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
                  <td className="px-5 py-8 text-center text-slate-500" colSpan="5">
                    {applications.length === 0 ? 'No applications yet.' : 'No matching applications found.'}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500" colSpan="5">
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
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
              <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                {isSaving ? 'Saving...' : 'Save Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Applications
