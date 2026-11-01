import React from 'react';
import { Search, X } from 'lucide-react';
import { ProjectMember, Label } from '../../types';

export interface FilterState {
  search: string;
  priority: string;
  assigneeId: string;
  labelId: string;
}

export interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  members: ProjectMember[];
  labels: Label[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  members,
  labels,
}) => {
  const hasActiveFilters =
    filters.search || filters.priority || filters.assigneeId || filters.labelId;

  const handleClear = () => {
    onFilterChange({
      search: '',
      priority: '',
      assigneeId: '',
      labelId: '',
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="Filter tasks by title or details..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assigneeId}
          onChange={(e) => onFilterChange({ ...filters, assigneeId: e.target.value })}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
            </option>
          ))}
        </select>

        {/* Label Filter */}
        {labels.length > 0 && (
          <select
            value={filters.labelId}
            onChange={(e) => onFilterChange({ ...filters, labelId: e.target.value })}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Labels</option>
            {labels.map((lbl) => (
              <option key={lbl.id} value={lbl.id}>
                {lbl.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
