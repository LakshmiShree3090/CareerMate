import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
  { label: 'Applications', icon: '📄', to: '/applications' },
  { label: 'Interviews', icon: '🎤', to: '/interviews' },
  { label: 'Resume Analysis', icon: '📑', to: '/resume-analysis' },
  { label: 'Cover Letter Generator', icon: '✉️', to: '/cover-letter' },
  { label: 'Profile', icon: '👤', to: '/profile' },
]

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    setIsOpen(false)
    navigate('/login')
  }

  function closeSidebar() {
    setIsOpen(false)
  }

  return (
    <>
      <button
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-lg text-slate-700 shadow-sm lg:hidden"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        ☰
      </button>

      {isOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={closeSidebar}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-200 pb-5">
          <p className="text-lg font-bold text-ink">CareerMate</p>
          <p className="mt-1 text-sm text-slate-500">Career workspace</p>
        </div>

        <nav className="mt-5 flex-1 space-y-1" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              key={item.to}
              onClick={closeSidebar}
              to={item.to}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={handleLogout}
          type="button"
        >
          <span aria-hidden="true">🚪</span>
          Logout
        </button>
      </aside>
    </>
  )
}

export default Sidebar
