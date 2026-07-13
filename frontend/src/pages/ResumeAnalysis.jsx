import { useState } from 'react'

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const analysisCards = [
    {
      title: 'Resume Score',
      value: `${analysis.score} / 100`,
      description: 'A strong starting point with room for improvement.',
      color: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      title: 'Skills Found',
      value: analysis.skills.join(', '),
      description: 'Technical skills detected in your resume.',
      color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Missing Skills',
      value: analysis.missingSkills.join(', '),
      description: 'Skills that could strengthen your profile.',
      color: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      title: 'Suggestions',
      value: analysis.suggestions.join(', '),
      description: 'Recommendations to improve your resume.',
      color: 'border-violet-200 bg-violet-50 text-violet-700',
    },
  ]

  async function handleAnalyze() {
    setIsLoading(true)
    setError('')

    try {
      const response = await api.post('/api/resume/analyze')
      setAnalysis(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not analyze resume')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold text-primary">CareerMate</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">AI Resume Analysis</h1>
            <p className="mt-2 text-slate-600">Review your resume insights and improvement areas.</p>
          </div>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={handleAnalyze}
            type="button"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </header>

        {error && <p className="mt-5 text-sm text-rose-600">{error}</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analysisCards.map((card) => (
            <article className={`rounded-lg border p-5 ${card.color}`} key={card.title}>
              <p className="text-sm font-medium">{card.title}</p>
              <p className="mt-4 text-xl font-bold">{card.value}</p>
              <p className="mt-3 text-sm leading-6">{card.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default ResumeAnalysis
