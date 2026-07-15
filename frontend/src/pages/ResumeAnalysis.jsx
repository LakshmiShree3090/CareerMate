import { useEffect, useState } from 'react'

import api from '../services/api'

const initialAnalysis = {
  score: 78,
  skills: ['React', 'JavaScript', 'Python'],
  missingSkills: ['Docker', 'SQL'],
  suggestions: [
    'Add measurable achievements',
    'Include more technical projects',
    'Improve ATS keywords',
  ],
}

function ResumeAnalysis() {
  const [analysis, setAnalysis] = useState(initialAnalysis)
  const [resumeFilename, setResumeFilename] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadResume() {
      try {
        const response = await api.get('/api/resume')
        setResumeFilename(response.data.filename || '')
      } catch {
        setResumeFilename('')
      }
    }

    loadResume()
  }, [])

  async function handleUpload(event) {
    const resumeFile = event.target.files?.[0]
    if (!resumeFile) return

    const formData = new FormData()
    formData.append('resume', resumeFile)
    setIsUploading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/resume/upload', formData)
      setResumeFilename(response.data.filename || resumeFile.name)
      setMessage(response.data.message || 'Resume uploaded successfully')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not upload resume')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  async function handleAnalyze() {
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await api.post('/api/resume/analyze')
      setAnalysis(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not analyze resume')
    } finally {
      setIsLoading(false)
    }
  }

  const atsScore = analysis.score
  const keywordMatch = Math.min(100, analysis.skills.length * 20)
  const scoreRing = { background: `conic-gradient(#2563eb ${analysis.score * 3.6}deg, #dbeafe 0deg)` }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.13),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-xl border border-white/60 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-2xl shadow-blue-950/20 sm:p-8">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-sm font-semibold text-blue-100">CareerMate Intelligence</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">AI Resume Analysis</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Upload your latest resume, then turn its AI insights into a stronger application.</p></div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
                <span aria-hidden="true">↑</span>{isUploading ? 'Uploading...' : 'Upload Resume'}
                <input accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={isUploading} onChange={handleUpload} type="file" />
              </label>
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoading} onClick={handleAnalyze} type="button">{isLoading ? 'Analyzing...' : 'Analyze Resume'}</button>
            </div>
          </div>
          {resumeFilename && <p className="relative mt-5 truncate text-sm text-blue-100">Current resume: <span className="font-semibold text-white">{resumeFilename}</span></p>}
        </section>

        {(error || message) && <p className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <article className="rounded-xl border border-white/80 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
            <p className="text-sm font-semibold text-primary">Resume Score</p>
            <div className="mt-5 flex items-center gap-6"><div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full p-3 shadow-inner" style={scoreRing}><div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-bold text-ink">{analysis.score}</span><span className="text-xs font-semibold text-slate-400">/ 100</span></div></div><div><p className="text-lg font-bold text-ink">Strong foundation</p><p className="mt-2 text-sm leading-6 text-slate-600">Your score reflects the skills and keywords currently detected in your resume.</p></div></div>
          </article>

          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-primary">✓</span><p className="mt-4 text-sm font-semibold text-slate-600">ATS Score</p><p className="mt-1 text-3xl font-bold text-ink">{atsScore}%</p><p className="mt-2 text-xs text-slate-500">Based on your current analysis.</p></article>
            <article className="rounded-xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-lg text-cyan-600">⌕</span><p className="mt-4 text-sm font-semibold text-slate-600">Keyword Match</p><p className="mt-1 text-3xl font-bold text-ink">{keywordMatch}%</p><p className="mt-2 text-xs text-slate-500">{analysis.skills.length} detected skill keywords.</p></article>
            <article className="rounded-xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">↗</span><p className="mt-4 text-sm font-semibold text-slate-600">Strengths</p><div className="mt-3 flex flex-wrap gap-2">{analysis.skills.map((skill) => <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" key={skill}>{skill}</span>)}</div></article>
            <article className="rounded-xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">!</span><p className="mt-4 text-sm font-semibold text-slate-600">Missing Skills</p><div className="mt-3 flex flex-wrap gap-2">{analysis.missingSkills.map((skill) => <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700" key={skill}>{skill}</span>)}</div></article>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-xl border border-white/80 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-lg text-rose-600">△</span><div><p className="text-sm font-semibold text-primary">Focus areas</p><h2 className="text-xl font-bold text-ink">Weaknesses</h2></div></div><div className="mt-5 space-y-3">{analysis.missingSkills.map((skill) => <article className="flex items-start gap-3 rounded-xl bg-white/80 p-4 shadow-md shadow-rose-950/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg" key={skill}><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-base text-amber-600">⚠</span><p className="pt-1 text-sm font-medium leading-6 text-slate-700">Consider adding evidence of {skill} experience.</p></article>)}</div></article>
          <article className="rounded-xl border border-white/80 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">✦</span><div><p className="text-sm font-semibold text-primary">Action plan</p><h2 className="text-xl font-bold text-ink">Suggestions</h2></div></div><div className="mt-5 space-y-3">{analysis.suggestions.map((suggestion) => <article className="flex items-start gap-3 rounded-xl bg-white/80 p-4 shadow-md shadow-indigo-950/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg" key={suggestion}><span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base text-blue-600">💡</span><p className="pt-1 text-sm font-medium leading-6 text-slate-700">{suggestion}</p></article>)}</div></article>
        </section>

        <section className="mt-6 rounded-xl border border-white/80 bg-white/75 p-6 shadow-xl shadow-slate-900/5 backdrop-blur"><div><p className="text-sm font-semibold text-primary">AI guidance</p><h2 className="mt-1 text-xl font-bold text-ink">Detailed AI Feedback</h2><p className="mt-2 text-sm text-slate-600">Prioritized improvements based on your latest analysis.</p></div><div className="mt-5 grid gap-4 md:grid-cols-3">{analysis.suggestions.map((suggestion, index) => <article className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-blue-50/60 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" key={suggestion}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-primary">0{index + 1}</span><p className="mt-4 text-sm font-semibold leading-6 text-ink">{suggestion}</p></article>)}</div></section>
      </div>
    </main>
  )
}

export default ResumeAnalysis
