"use client"
import useSeller from '@/hooks/useSeller';
import useSidebar from '@/hooks/useSidebar'
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'
import Box from '../box';
import { Sidebar } from './sidebar.style';
import Link from 'next/link';
import Logo from '@/app/svg/logo';
import SidebarItem from './sidebar.item';
import SidebarMenu from './sidebar.menu';
import { ListOrdered } from 'lucide-react';
import Payment from '@/app/svg/payment';
import Home from '@/app/svg/home';
import SquarePlus from '@/app/svg/square.plus';
import PackageSearch from './packageSearch';
import CalendarPlus from '@/app/svg/calendar.plus';
import BellPlus from '@/app/svg/bell.plus';
import Mail from '@/app/svg/mail';
import Setting from '@/app/svg/setting';
import Headset from '@/app/svg/headset';
import TicketPercent from '@/app/svg/ticket.percent';
import LogOut from '@/app/svg/logout';

function SidebarBarWrapper() {

  const {activeSidebar, setActiveSidebar} = useSidebar();
  const pathName = usePathname();
  const {seller} = useSeller();

  useEffect(() => {
  setActiveSidebar(pathName);
}, [pathName, setActiveSidebar]);

const getIconColor = (route: string) => activeSidebar === route ? "#0085ff" : "#969696";
  return (
    <Box 
className="sidebar-wrapper" css={{
  height: "100vh",
  zIndex: 202,
  position: "sticky",
  padding: "8px",
  top: "0",
  overflowY: "scroll",
  scrollbarWidth: "none",
}}>
      <Sidebar.Header>
        <Box>
          <Link href="/" className='flex justify-center text-center gap-2 text-white'>
          <Logo/>
          <Box>
            <h3 className='text-base font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]'>{seller?.shop?.name}</h3>
            <h5 className='font-medium text-xs text-shadow-gray-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]'>
                {seller?.shop?.address}
            </h5>
          </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div className='block my-3 h-full'>
        <SidebarItem
          isActive={activeSidebar === "/dashboard"}
          title="Dashboard"
          href="/dashboard"
          icon={<Home fill={getIconColor("/dashboard")} />}
        />
        <div className='mt-3'>
        <SidebarMenu title="Main Menu">
          <SidebarItem
            isActive={activeSidebar === "/dashboard/orders"}
            title="Orders"
            href="/dashboard/orders"
            icon={
              <ListOrdered
                size={26}
                color={getIconColor("/dashboard/orders")}
              />
            }
          />
          <SidebarItem
  isActive={activeSidebar === "/dashboard/payments"}
  title="Payments"
  href="/dashboard/payments"
  icon={<Payment fill={getIconColor("/dashboard/payments")} />}
/>
        </SidebarMenu>
        <SidebarMenu title="Products">
          <SidebarItem
            isActive={activeSidebar === "/dashboard/create-product"}
            title="Create Product"
            href="/dashboard/create-product"
            icon={
              <SquarePlus
                fill={getIconColor("/dashboard/create-product")}
              />
            }
          />
          <SidebarItem
            isActive={activeSidebar === "/dashboard/all-products"}
            title="All Products"
            href="/dashboard/all-products"
            icon={
              <PackageSearch
                color={getIconColor("/dashboard/all-products")}
              />
            }
          />
        </SidebarMenu>

<SidebarMenu title="Events">
  <SidebarItem
    isActive={activeSidebar === "/dashboard/create-event"}
    title="Create Event"
    href="/dashboard/create-event"
    icon={
      <CalendarPlus
        color={getIconColor("/dashboard/create-event")}
      />
    }
  />
  <SidebarItem
    isActive={activeSidebar === "/dashboard/all-events"}
    title="All Events"
    href="/dashboard/all-events"
    icon={
      <BellPlus
        color={getIconColor("/dashboard/all-events")}
      />
    }
  />
</SidebarMenu>
<SidebarMenu title="Controllers">
  <SidebarItem
    isActive={activeSidebar === "/dashboard/inbox"}
    title="Inbox"
    href="/dashboard/inbox"
    icon={
      <Mail
        color={getIconColor("/dashboard/inbox")}
      />
    }
  />
  <SidebarItem
  isActive={activeSidebar === "/dashboard/settings"}
  title="Settings"
  href="/dashboard/settings"
  icon={
    <Setting
      color={getIconColor("/dashboard/settings")}
    />
  }
/>

</SidebarMenu>
<SidebarItem
  isActive={activeSidebar === "/dashboard/notifications"}
  title="Notifications"
  href="/notifications"
  icon={
    <Headset
      color={getIconColor("/dashboard/notifications")}
    />
  }
/>
<SidebarMenu title="Extras">
  <SidebarItem
    isActive={activeSidebar === "/dashboard/discount-codes"}
    title="Discount Codes"
    href="/dashboard/discount-codes"
    icon={
      <TicketPercent
        color={getIconColor("/dashboard/discount-codes")}
      />
    }
  />
</SidebarMenu>
<SidebarItem
  isActive={activeSidebar === "/logout"}
  title="Logout"
  href="/"
  icon={<LogOut color={getIconColor("/logout")} />}
/>
        </div>
      
      </div>
    </Box>
  )
}

export default SidebarBarWrapper