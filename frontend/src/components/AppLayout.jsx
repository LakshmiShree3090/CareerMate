import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'

function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
      />
      <div className={`transition-[padding] duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
