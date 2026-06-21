/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import TaskList from './components/TaskList';
import LineageExplorer from './components/LineageExplorer';
import { LayoutList, GitMerge } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'lineage' | 'tasks'>('lineage');

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans">
      <header className="flex-none bg-white border-b border-slate-200 text-slate-900 shadow-sm z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-indigo-700">MIKA PROJECT</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Phase 1 Conversion & Lineage Tracking</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('lineage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'lineage' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitMerge size={16} /> Lineage Explorer
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList size={16} /> Tasks & Rollout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'lineage' ? <LineageExplorer /> : <TaskList />}
      </main>
    </div>
  );
}
