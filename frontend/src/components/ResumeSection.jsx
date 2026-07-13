import { useEffect, useState } from 'react'

import api from '../services/api'

function ResumeSection() {
  const [filename, setFilename] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    async function loadResume() {
      try {
        const response = await api.get('/api/resume')
        setFilename(response.data.filename || '')
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load resume')
      }
    }

    loadResume()
  }, [])

  async function handleUpload(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const resumeFile = formData.get('resume')

    if (!resumeFile?.name) {
      setError('Please choose a resume file')
      return
    }

    setIsUploading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/resume/upload', formData)

      if (response.status === 200 || response.status === 201) {
        setFilename(response.data.filename || resumeFile.name)
        setMessage(response.data.message || 'Resume uploaded successfully')
        event.currentTarget.reset()
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not upload resume')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-ink">Resume</h2>
      <p className="mt-2 text-sm text-slate-600">
        Current resume: {filename || 'No resume uploaded'}
      </p>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleUpload}>
        <input
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 sm:max-w-md"
          name="resume"
          type="file"
        />
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </section>
  )
}

export default ResumeSection
