import SidebarWrapper from "../shared/components/sidebar";
import type { ReactNode } from "react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="min-h-screen w-[335px] shrink-0 border-r border-[#17191f] bg-black px-8 py-8">
        <SidebarWrapper />
      </aside>

      <main className="min-h-screen min-w-0 flex-1 bg-black">{children}</main>
    </div>
  );
};

export default DashboardLayout;
