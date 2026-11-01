import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateProjectModal } from '../projects/CreateProjectModal';

export const DashboardLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (location.pathname.startsWith('/projects') && location.pathname.endsWith('/board'))
      return 'Project Board';
    if (location.pathname.startsWith('/projects') && location.pathname.endsWith('/settings'))
      return 'Project Settings';
    if (location.pathname.startsWith('/projects')) return 'Projects';
    if (location.pathname.startsWith('/profile')) return 'Account Profile';
    return 'Flowboard Workspace';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          title={getPageTitle()}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
    </div>
  );
};
