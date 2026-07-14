import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
