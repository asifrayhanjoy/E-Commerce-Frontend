import SidebarBarWrapper from '@/app/shared/components/sidebar/sidebar'
import React from 'react'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex bg-black h-full min-h-screen'>
                  {/* {Sidebar} */}
                  <aside className='w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 text-white p-4 '>
                  <div className='sticky top-0'>
<SidebarBarWrapper>

</SidebarBarWrapper>
                  </div>
                  </aside>
                  <main className='flex-1'>{children}</main>
    </div>
  )
}

export default Layout