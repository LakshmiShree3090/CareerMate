import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
  { label: 'Applications', icon: '📄', to: '/applications' },
  { label: 'Resume Analysis', icon: '📑', to: '/resume-analysis' },
  { label: 'Cover Letter Generator', icon: '✉️', to: '/cover-letter' },
  { label: 'Profile', icon: '👤', to: '/profile' },
]

function Sidebar({ isCollapsed, onToggleCollapse }) {
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
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-lg text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur lg:hidden"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        ☰
      </button>

      {isOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm lg:hidden" onClick={closeSidebar} type="button" />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/60 bg-white/75 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-[transform,width] duration-300 lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex items-start border-b border-slate-200/80 pb-5 ${isCollapsed ? 'justify-center lg:justify-between' : 'justify-between'}`}>
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <p className="text-lg font-bold text-ink">CareerMate</p>
            <p className="mt-1 text-sm text-slate-500">Career workspace</p>
          </div>
          {isCollapsed && <p className="hidden text-lg font-bold text-primary lg:block">C</p>}
          <button
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-primary lg:flex"
            onClick={onToggleCollapse}
            type="button"
          >
            {isCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="mt-5 flex-1 space-y-1" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isCollapsed ? 'lg:justify-center lg:px-2' : ''} ${isActive ? 'bg-blue-50 text-primary shadow-sm before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary' : 'text-slate-600 hover:translate-x-0.5 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
              key={item.to}
              onClick={closeSidebar}
              title={isCollapsed ? item.label : undefined}
              to={item.to}
            >
              <span aria-hidden="true" className="flex w-5 shrink-0 justify-center text-base">{item.icon}</span>
              <span className={isCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          type="button"
        >
          <span aria-hidden="true" className="flex w-5 shrink-0 justify-center text-base">🚪</span>
          <span className={isCollapsed ? 'lg:hidden' : ''}>Logout</span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar
