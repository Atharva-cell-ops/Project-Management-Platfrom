import React from 'react';
import { Menu, Sun, Moon, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

export interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onOpenCreateProject?: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  onOpenCreateProject,
  title = 'Flowboard Workspace',
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      {/* Left side: Hamburger and Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Create Project Button */}
        {onOpenCreateProject && (
          <Button
            size="sm"
            onClick={onOpenCreateProject}
            leftIcon={<Plus className="w-4 h-4" />}
            className="hidden sm:inline-flex"
          >
            New Project
          </Button>
        )}
      </div>
    </header>
  );
};
