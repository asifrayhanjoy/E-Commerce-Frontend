import SidebarBarWrapper from '@/app/shared/components/sidebar/sidebar'
import React from 'react'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex h-screen overflow-hidden bg-black'>
                  {/* {Sidebar} */}
                  <aside className='h-screen w-[280px] min-w-[250px] max-w-[300px] overflow-y-auto border-r border-r-slate-800 p-4 text-white'>
                  <div className='min-h-full'>
<SidebarBarWrapper>

</SidebarBarWrapper>
                  </div>
                  </aside>
                  <main className='h-screen flex-1 overflow-y-auto'>{children}</main>
    </div>
  )
}

export default Layout
