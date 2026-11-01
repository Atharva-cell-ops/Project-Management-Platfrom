import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 ring-8 ring-indigo-50/50 dark:ring-indigo-950/20">
        <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
        404
      </h1>
      <h2 className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mt-2">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-8 leading-relaxed">
        The workspace route or resource you are looking for does not exist or has been moved.
      </p>

      <Link to="/dashboard">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
