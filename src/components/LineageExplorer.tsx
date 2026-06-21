import React, { useEffect, useMemo, useRef, useState } from 'react';
import { lineageData } from '../data/types';
import { Search, X, Layers, Monitor, ChevronRight } from 'lucide-react';

const COL_NAMES = ['Bronze', 'Silver L1', 'Silver L2', 'Silver L3', 'Silver L4', 'Gold', 'Gold-Mart', 'Deprecated'];
const COL_COLORS = ['#1e293b', '#334155', '#475569', '#475569', '#475569', '#ca8a04', '#2563eb', '#991b1b'];

const NODE_W = 164;
const NODE_H = 34;
const V_GAP = 8;
const COL_PAD_X = 20;
const COL_GAP = 70;
const TOP_PAD = 46;
const MARGIN_LEFT = 16;
const MARGIN_TOP = 16;

export default function LineageExplorer() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    new Set(['bronze', 'silver', 'gold', 'goldmart', 'deprecated'])
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute Layout completely in useMemo
  const { nodePos, colX, numCols, canvasW, canvasH, edgesSrcTgt, exitPort, entryPort } = useMemo(() => {
    const colGroups: Record<number, string[]> = {};
    lineageData.nodes.forEach(n => {
      if (!colGroups[n.col]) colGroups[n.col] = [];
      colGroups[n.col].push(n.id);
    });

    Object.keys(colGroups).forEach(col => colGroups[parseInt(col)].sort());

    const numCols = 8;
    const colX: Record<number, number> = {};
    let cx = MARGIN_LEFT;
    for (let c = 0; c < numCols; c++) {
      colX[c] = cx;
      cx += NODE_W + COL_PAD_X * 2 + COL_GAP;
    }

    const nodePos: Record<string, { x: number, y: number }> = {};
    for (let c = 0; c < numCols; c++) {
      const list = colGroups[c] || [];
      list.forEach((id, i) => {
        nodePos[id] = {
          x: colX[c] + COL_PAD_X,
          y: MARGIN_TOP + TOP_PAD + i * (NODE_H + V_GAP)
        };
      });
    }

    const maxRows = Math.max(...Array.from({ length: numCols }, (_, c) => (colGroups[c] || []).length));
    const canvasW = cx + 20;
    const canvasH = MARGIN_TOP + TOP_PAD + maxRows * (NODE_H + V_GAP) + 60;

    const edgesBySource: Record<string, string[]> = {};
    const edgesByTarget: Record<string, string[]> = {};
    lineageData.edges.forEach(e => {
      if (!edgesBySource[e.source]) edgesBySource[e.source] = [];
      if (!edgesByTarget[e.target]) edgesByTarget[e.target] = [];
      edgesBySource[e.source].push(e.target);
      edgesByTarget[e.target].push(e.source);
    });

    const distributePorts = (ids: string[]) => {
      const n = ids.length;
      if (n === 1) return { [ids[0]]: 0.5 };
      const margin = 0.15;
      const sorted = [...ids].sort((a, b) => (nodePos[a]?.y || 0) - (nodePos[b]?.y || 0));
      const out: Record<string, number> = {};
      sorted.forEach((id, i) => {
        out[id] = margin + (1 - 2 * margin) * i / (n - 1);
      });
      return out;
    };

    const exitPort: Record<string, number> = {};
    const entryPort: Record<string, number> = {};

    Object.entries(edgesBySource).forEach(([src, tgts]) => {
      const ports = distributePorts(tgts.filter(t => nodePos[t]));
      Object.entries(ports).forEach(([tgt, f]) => { exitPort[`${src}|${tgt}`] = f; });
    });
    Object.entries(edgesByTarget).forEach(([tgt, srcs]) => {
      const ports = distributePorts(srcs.filter(s => nodePos[s]));
      Object.entries(ports).forEach(([src, f]) => { entryPort[`${src}|${tgt}`] = f; });
    });

    return { nodePos, colX, numCols, canvasW, canvasH, edgesSrcTgt: lineageData.edges, exitPort, entryPort };
  }, []);

  const { downstream, upstream } = useMemo(() => {
    const dn: Record<string, string[]> = {};
    const up: Record<string, string[]> = {};
    lineageData.nodes.forEach(n => { dn[n.id] = []; up[n.id] = []; });
    lineageData.edges.forEach(e => {
      dn[e.source]?.push(e.target);
      up[e.target]?.push(e.source);
    });
    return { downstream: dn, upstream: up };
  }, []);

  const getAllUpstream = (id: string) => {
    const visited = new Set<string>();
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      (upstream[cur] || []).forEach(u => {
        if (!visited.has(u)) { visited.add(u); queue.push(u); }
      });
    }
    return visited;
  };

  const getAllDownstream = (id: string) => {
    const visited = new Set<string>();
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift()!;
      (downstream[cur] || []).forEach(d => {
        if (!visited.has(d)) { visited.add(d); queue.push(d); }
      });
    }
    return visited;
  };

  const visibleNodeIds = useMemo(() => {
    return new Set(
      lineageData.nodes
        .filter(n => {
          if (!activeLayers.has(n.layer)) return false;
          if (pageFilter && !n.pages.includes(pageFilter)) return false;
          if (search) {
            const q = search.toLowerCase();
            if (!n.id.toLowerCase().includes(q)) return false;
          }
          return true;
        })
        .map(n => n.id)
    );
  }, [activeLayers, pageFilter, search]);

  const { highlighted, upSet, downSet } = useMemo(() => {
    const upSet = selectedNode ? getAllUpstream(selectedNode) : new Set<string>();
    const downSet = selectedNode ? getAllDownstream(selectedNode) : new Set<string>();
    const highlighted = new Set<string>();
    if (selectedNode) {
      highlighted.add(selectedNode);
      upSet.forEach(id => highlighted.add(id));
      downSet.forEach(id => highlighted.add(id));
    }
    return { highlighted, upSet, downSet };
  }, [selectedNode]);

  const toggleLayer = (l: string) => {
    const next = new Set(activeLayers);
    if (next.has(l)) next.delete(l);
    else next.add(l);
    setActiveLayers(next);
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-50 text-slate-800">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 bg-white shrink-0 select-none">
        <h1 className="font-extrabold text-sm tracking-wider text-indigo-600 uppercase">MIKA Lineage</h1>

        <div className="relative w-64 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-8 pr-8 text-xs outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
            placeholder="Search node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 px-3 rounded-md outline-none focus:border-indigo-500 max-w-[200px]"
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
        >
          <option value="">All dashboards / reports</option>
          {lineageData.pages.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'bronze', label: 'Bronze', color: 'border-amber-300 bg-amber-50 text-amber-700' },
            { id: 'silver', label: 'Silver', color: 'border-slate-300 bg-white text-slate-700' },
            { id: 'gold', label: 'Gold', color: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
            { id: 'goldmart', label: 'Gold-Mart', color: 'border-blue-300 bg-blue-50 text-blue-700' },
            { id: 'deprecated', label: 'Deprecated', color: 'border-rose-300 bg-rose-50 text-rose-700' }
          ].map(l => (
            <button
              key={l.id}
              onClick={() => toggleLayer(l.id)}
              className={`px-3 py-1 text-[10px] uppercase tracking-wide font-bold rounded border transition-colors ${
                activeLayers.has(l.id) ? l.color : 'border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setSelectedNode(null);
            setSearch('');
            setPageFilter('');
            setActiveLayers(new Set(['bronze', 'silver', 'gold', 'goldmart', 'deprecated']));
          }}
          className="ml-auto px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded bg-slate-50 hover:text-slate-800 hover:border-slate-400 transition-colors"
        >
          Reset View
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        <div className="flex-1 overflow-auto bg-slate-50 relative">
          <div style={{ width: canvasW, height: canvasH }} className="relative">
            {/* Columns Background & Labels */}
            {Array.from({ length: numCols }).map((_, c) => {
              const bgHeight = (lineageData.nodes.filter(n => n.col === c).length) * (NODE_H + V_GAP) + 16;
              return (
                <div key={`col-${c}`}>
                  <div
                    className="absolute bg-white border border-slate-200 rounded-md pointer-events-none shadow-sm"
                    style={{ left: colX[c], width: NODE_W + COL_PAD_X * 2, top: MARGIN_TOP + 30, height: bgHeight }}
                  />
                  <div
                    className="absolute text-[10px] font-bold tracking-widest uppercase text-slate-500 text-center uppercase"
                    style={{ left: colX[c], width: NODE_W + COL_PAD_X * 2, top: MARGIN_TOP }}
                  >
                    {COL_NAMES[c]}
                  </div>
                </div>
              );
            })}

            {/* Edges SVG */}
            <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: canvasW, height: canvasH }}>
              <defs>
                <marker id="arr-default" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                </marker>
                <marker id="arr-up" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
                </marker>
                <marker id="arr-down" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
                </marker>
              </defs>
              {edgesSrcTgt.map(e => {
                const sp = nodePos[e.source];
                const tp = nodePos[e.target];
                if (!sp || !tp) return null;

                const srcVis = visibleNodeIds.has(e.source);
                const tgtVis = visibleNodeIds.has(e.target);
                if (!srcVis || !tgtVis) return null;

                let marker = "url(#arr-default)";
                let stroke = "#cbd5e1";
                let opacity = 0.5;
                let strokeWidth = 1.2;

                if (selectedNode) {
                  const sUp = upSet.has(e.source);
                  const tUp = upSet.has(e.target);
                  const sDn = downSet.has(e.source);
                  const tDn = downSet.has(e.target);

                  if ((e.target === selectedNode && sUp) || (sUp && tUp)) {
                    stroke = "#10b981"; opacity = 1; strokeWidth = 2; marker = "url(#arr-up)";
                  } else if ((e.source === selectedNode && tDn) || (sDn && tDn)) {
                    stroke = "#f59e0b"; opacity = 1; strokeWidth = 2; marker = "url(#arr-down)";
                  } else {
                    opacity = 0.08;
                  }
                }

                const exitFrac = exitPort[`${e.source}|${e.target}`] ?? 0.5;
                const entryFrac = entryPort[`${e.source}|${e.target}`] ?? 0.5;

                const sx = sp.x + NODE_W;
                const sy = sp.y + NODE_H * exitFrac;
                const tx = tp.x;
                const ty = tp.y + NODE_H * entryFrac;

                const dx = Math.abs(tx - sx);
                const cpx = Math.max(dx * 0.5, 40);
                const d = `M${sx},${sy} C${sx + cpx},${sy} ${tx - cpx},${ty} ${tx},${ty}`;

                return (
                  <path
                    key={`${e.source}|${e.target}`}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    markerEnd={marker}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {lineageData.nodes.map(n => {
              if (!visibleNodeIds.has(n.id)) return null;

              const pos = nodePos[n.id];
              const isSelected = selectedNode === n.id;
              const isUpstream = selectedNode && upSet.has(n.id);
              const isDownstream = selectedNode && downSet.has(n.id);
              const isDimmed = selectedNode && !isSelected && !isUpstream && !isDownstream;

              let bg = "bg-slate-800";
              let border = "border-slate-700";
              let text = "text-slate-700";

              if (n.layer === 'bronze') { bg = "bg-amber-50"; border = "border-amber-300"; text = "text-amber-700"; }
              else if (n.layer === 'gold') { bg = "bg-yellow-50"; border = "border-yellow-300"; text = "text-yellow-700"; }
              else if (n.layer === 'goldmart') { bg = "bg-blue-50"; border = "border-blue-300"; text = "text-blue-700"; }
              else if (n.layer === 'deprecated') { bg = "bg-rose-50"; border = "border-rose-300"; text = "text-rose-700"; }
              else { bg = "bg-white"; border = "border-slate-300"; text = "text-slate-700"; }

              let extraStyle = "";
              if (isSelected) {
                border = "border-indigo-400";
                extraStyle = "ring-2 ring-indigo-500/50 shadow-[0_0_16px_rgba(129,140,248,0.4)] z-30 opacity-100";
              } else if (isUpstream) {
                border = "border-emerald-400";
                extraStyle = "shadow-[0_0_8px_rgba(52,211,153,0.3)] z-20 opacity-100";
              } else if (isDownstream) {
                border = "border-amber-400";
                extraStyle = "shadow-[0_0_8px_rgba(251,146,60,0.3)] z-20 opacity-100";
              } else if (isDimmed) {
                extraStyle = "opacity-30 border-slate-200 bg-slate-50 text-slate-400";
              }

              return (
                <div
                  key={n.id}
                  onClick={(e) => {
                    setSelectedNode(isSelected ? null : n.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                  }}
                  className={`absolute flex items-center justify-center font-mono text-[11px] font-bold rounded-md border-[1.5px] cursor-pointer transition-all hover:z-50 select-none overflow-hidden ${bg} ${border} ${text} ${extraStyle}`}
                  style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
                  title={n.label}
                >
                  {n.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-[300px] border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 backdrop-blur-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Node Inspector</h2>
          </div>
          <div className="p-5 flex-1">
            {!selectedNode ? (
              <div className="text-sm text-slate-500 leading-relaxed text-center mt-12 bg-slate-50 border border-slate-200 rounded-lg p-6">
                Click any node to trace its complete pipeline lineage.
                <div className="mt-8 flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-emerald-400 bg-emerald-50"></div> Upstream sources</div>
                  <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-amber-400 bg-amber-50"></div> Downstream targets</div>
                  <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-indigo-400 bg-indigo-50 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div> Selected node</div>
                </div>
              </div>
            ) : (() => {
              const nd = lineageData.nodes.find(x => x.id === selectedNode)!;
              const directUp = (upstream[selectedNode] || []).filter(x => visibleNodeIds.has(x));
              const directDn = (downstream[selectedNode] || []).filter(x => visibleNodeIds.has(x));

              const allUp = Array.from(upSet);
              const allDn = Array.from(downSet);

              return (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-lg font-mono font-extrabold text-slate-800 mb-2 break-all">{nd.id}</div>
                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-200 bg-slate-50 text-slate-600 mb-6">
                    {nd.layer}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-xl font-black text-slate-700">{directUp.length}</span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1 text-center">Direct Up</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-xl font-black text-slate-700">{directDn.length}</span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1 text-center">Direct Down</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-xl font-black text-emerald-600">{allUp.length}</span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1 text-center">All Upstream</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-xl font-black text-amber-600">{allDn.length}</span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1 text-center">All Downstream</span>
                    </div>
                  </div>

                  {nd.pages.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <Monitor size={12} className="text-indigo-500" /> Utilized In Dashboards
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {nd.pages.map(p => (
                          <div key={p} className="text-[11px] font-medium text-slate-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded text-left">
                            {p.replace('Dashboard - ', '').replace('Report - ', '')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {directUp.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-emerald-500"></div> Direct Upstream ({directUp.length})
                      </div>
                      <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {directUp.map(id => (
                          <button
                            key={id}
                            onClick={() => setSelectedNode(id)}
                            className="text-left font-mono text-[11px] bg-white hover:bg-slate-50 border-l-2 border-emerald-400 border border-slate-200 px-3 py-2 rounded-r transition-colors shadow-sm text-slate-600 hover:text-slate-900"
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {directDn.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm bg-amber-500"></div> Direct Downstream ({directDn.length})
                      </div>
                      <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {directDn.map(id => (
                          <button
                            key={id}
                            onClick={() => setSelectedNode(id)}
                            className="text-left font-mono text-[11px] bg-white hover:bg-slate-50 border-l-2 border-amber-400 border border-slate-200 px-3 py-2 rounded-r transition-colors shadow-sm text-slate-600 hover:text-slate-900"
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
