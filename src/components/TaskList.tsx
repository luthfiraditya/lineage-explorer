import { useState } from 'react';
import { tasks, type Task } from '../data/types';
import { CheckCircle2, ChevronRight, Hash, Search, X } from 'lucide-react';

export default function TaskList() {
  const [activeWave, setActiveWave] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [activeCond, setActiveCond] = useState<'all' | 'A' | 'B' | 'C' | 'D' | 'H' | 'F'>('all');
  const [taskData, setTaskData] = useState<Record<string, { status: string, engineer: string, note: string }>>({});

  const updateTask = (id: string, field: 'status' | 'engineer' | 'note', value: string) => {
    setTaskData(prev => ({ ...prev, [id]: { ...(prev[id] || { status: 'To Do', engineer: '', note: '' }), [field]: value }}));
  };

  const visibleTasks = tasks.filter((t) => {
    const matchWave = activeWave === 'all' || t.wave.toString() === activeWave;
    const matchCond = activeCond === 'all' || t.cond === activeCond;
    return matchWave && matchCond;
  });

  const waves = [
    { id: 1, title: 'Wave 1 — No dependency, start immediately', color: 'bg-green-50 text-green-600 border-green-500', count: 38 },
    { id: 2, title: 'Wave 2 — Needs Wave 1 complete', color: 'bg-blue-50 text-blue-600 border-blue-500', count: 10 },
    { id: 3, title: 'Wave 3 — Needs Wave 1+2 complete', color: 'bg-purple-50 text-purple-600 border-purple-500', count: 5 },
    { id: 4, title: 'Wave 4 — Needs Wave 1+2+3 complete', color: 'bg-red-50 text-red-600 border-red-500', count: 7 },
  ];

  const clearFilters = () => {
    setActiveWave('all');
    setActiveCond('all');
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-50 text-slate-900 overflow-hidden">
      <div className="flex bg-white items-center gap-4 px-6 border-b border-slate-200">
        <div className="flex-1 py-3 text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Stats Overview
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-xl font-extrabold text-slate-800">60</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Scripts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-extrabold text-slate-800">38</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pure Bronze</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-extrabold text-slate-800">22</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Has Silver</span>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] items-center flex-wrap gap-4 overflow-x-auto text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest mr-2">Wave:</span>
          {['all', '1', '2', '3', '4'].map((w) => (
            <button
              key={w}
              onClick={() => setActiveWave(w as any)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                activeWave === w
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-800 hover:text-slate-800'
              }`}
            >
              {w === 'all' ? 'All' : `Wave ${w}`}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest mr-2">Condition:</span>
          {['all', 'A', 'B', 'C', 'D', 'H', 'F'].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCond(c as any)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                activeCond === c
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-600 hover:text-indigo-600'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
        {(activeWave !== 'all' || activeCond !== 'all') && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-slate-400 hover:text-rose-500 text-xs font-medium px-2 py-1 rounded"
          >
            <X size={14} /> Clear Default
          </button>
        )}
        <div className="text-xs font-medium text-slate-400 ml-auto">{visibleTasks.length} shown</div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/50 p-6 pb-24">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {waves.map((waveInfo) => {
            const waveTasks = visibleTasks.filter((t) => t.wave === waveInfo.id);
            if (waveTasks.length === 0) return null;

            return (
              <div key={waveInfo.id}>
                <div className={`flex items-center px-4 py-3 border-t-4 border-b ${waveInfo.color}`}>
                  <span className="font-extrabold text-sm flex-1">{waveInfo.title}</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/50">{waveInfo.count} scripts</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">#</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">Target DSO</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">Condition</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 tracking-wider uppercase">Complexity</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">Downstream</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">Used In</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">Source Inputs</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase w-32">Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase w-32">Engineer</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase w-48">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {waveTasks.map((t, i) => {
                        const tData = taskData[t.id] || { status: 'To Do', engineer: '', note: '' };
                        return (
                        <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-3 align-top text-xs font-bold text-slate-500">
                            #{tasks.findIndex(allT => allT.id === t.id) + 1}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="font-mono text-[13px] font-extrabold text-amber-600">{t.id}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">Silver L{t.wave}</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {t.cond} — Route
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-center">
                            <div className={`text-[11px] font-bold ${
                              t.complexity === 'Low' ? 'text-emerald-600' :
                              t.complexity === 'Med' ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                              {t.complexity}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{t.inputs} input(s)</div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                <div 
                                  className={`h-full rounded-full ${t.downstream > 15 ? 'bg-emerald-500' : t.downstream > 5 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                  style={{ width: `${Math.min(100, Math.max(5, (t.downstream / 36) * 100))}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-slate-700">{t.downstream}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">nodes</div>
                          </td>
                          <td className="px-4 py-3 align-top max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {t.usedIn.map(u => (
                                <span key={u} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  {u}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top max-w-[340px]">
                            {t.fromBronze.length > 0 && (
                              <div className="flex items-start gap-2 mb-1.5">
                                <span className="text-[10px] font-bold text-amber-600 w-20 shrink-0 pt-0.5">From Bronze:</span>
                                <div className="flex flex-wrap gap-1">
                                  {t.fromBronze.map(b => (
                                    <code key={b} className="text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{b}</code>
                                  ))}
                                </div>
                              </div>
                            )}
                            {t.fromSilver.length > 0 && (
                              <div className="flex items-start gap-2 mb-1.5">
                                <span className="text-[10px] font-bold text-blue-600 w-20 shrink-0 pt-0.5">From Silver:</span>
                                <div className="flex flex-wrap gap-1">
                                  {t.fromSilver.map(s => (
                                    <code key={s} className="text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{s}</code>
                                  ))}
                                </div>
                              </div>
                            )}
                            {t.deprecated && t.deprecated.length > 0 && (
                              <div className="flex items-start gap-2 mb-1.5 opacity-60">
                                <span className="text-[10px] font-bold text-rose-600 w-20 shrink-0 pt-0.5">Deprecated:</span>
                                <div className="flex flex-wrap gap-1">
                                  {t.deprecated.map(d => (
                                    <code key={d} className="text-[10px] bg-rose-50 px-1 py-0.5 rounded border border-rose-200 text-rose-800 line-through">{d}</code>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select 
                              value={tData.status}
                              onChange={(e) => updateTask(t.id, 'status', e.target.value)}
                              className={`text-xs font-bold px-2 py-1 rounded w-full border ${tData.status === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : tData.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input 
                              type="text" 
                              placeholder="Unassigned"
                              value={tData.engineer}
                              onChange={(e) => updateTask(t.id, 'engineer', e.target.value)}
                              className="text-xs w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-indigo-400"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input 
                              type="text" 
                              placeholder="Add note..."
                              value={tData.note}
                              onChange={(e) => updateTask(t.id, 'note', e.target.value)}
                              className="text-xs w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-indigo-400"
                            />
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {visibleTasks.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">
              No tasks match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
