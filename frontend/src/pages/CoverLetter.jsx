import { useState } from 'react'

import api from '../services/api'

function CoverLetter() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    setError('')

    try {
      const response = await api.post('/api/cover-letter/generate', {
        company,
        role,
      })
      setCoverLetter(response.data.coverLetter)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not generate cover letter')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold text-primary">CareerMate</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">AI Cover Letter Generator</h1>
          <p className="mt-2 text-slate-600">Create a tailored cover letter for your next application.</p>
        </header>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Company Name
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setCompany(event.target.value)}
                type="text"
                value={company}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Job Role
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setRole(event.target.value)}
                type="text"
                value={role}
              />
            </label>
          </div>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Generated Cover Letter
            <textarea
              className="mt-2 min-h-56 w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              readOnly
              value={coverLetter}
            />
          </label>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

          <button
            className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isGenerating}
            onClick={handleGenerate}
            type="button"
          >
            {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </section>
      </div>
    </main>
  )
}

export default CoverLetter
