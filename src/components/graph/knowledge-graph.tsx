"use client";

import * as React from "react";
import Link from "next/link";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { RELATION_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface GNode {
  id: string;
  name: string;
  slug: string;
  status: string;
  importance: number;
  category: string;
  color: string;
}
interface GEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface Positioned extends SimulationNodeDatum {
  id: string;
  r: number;
}

const W = 1200;
const H = 760;

/** d3-force layout, run to completion once for the given node/edge set. */
function computeLayout(nodes: GNode[], edges: GEdge[]): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map();

  const sim: Positioned[] = nodes.map((n, i) => ({
    id: n.id,
    r: 5 + n.importance * 1.7,
    // deterministic ring seed so re-renders don't jump around
    x: W / 2 + Math.cos((i / nodes.length) * 2 * Math.PI) * 260,
    y: H / 2 + Math.sin((i / nodes.length) * 2 * Math.PI) * 220,
  }));
  const byId = new Map(sim.map((s) => [s.id, s]));
  const links = edges
    .filter((e) => byId.has(e.source) && byId.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  const charge = -140 - 6000 / Math.max(nodes.length, 8);

  forceSimulation(sim)
    .force("charge", forceManyBody().strength(charge))
    .force(
      "link",
      forceLink(links)
        .id((d) => (d as Positioned).id)
        .distance(90)
        .strength(0.5),
    )
    .force("collide", forceCollide<Positioned>().radius((d) => d.r + 16).strength(0.9))
    .force("x", forceX(W / 2).strength(0.045))
    .force("y", forceY(H / 2).strength(0.055))
    .stop()
    .tick(420);

  const out = new Map<string, { x: number; y: number }>();
  for (const s of sim) out.set(s.id, { x: s.x ?? W / 2, y: s.y ?? H / 2 });
  return out;
}

export function KnowledgeGraph({ nodes, edges }: { nodes: GNode[]; edges: GEdge[] }) {
  const categories = React.useMemo(
    () => Array.from(new Set(nodes.map((n) => n.category))).sort(),
    [nodes],
  );
  const colorByCat = React.useMemo(() => {
    const m = new Map<string, string>();
    nodes.forEach((n) => m.set(n.category, n.color));
    return m;
  }, [nodes]);

  const degree = React.useMemo(() => {
    const d = new Map<string, number>();
    for (const e of edges) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    }
    return d;
  }, [edges]);

  const neighborsOf = React.useCallback(
    (id: string) => {
      const s = new Set<string>([id]);
      for (const e of edges) {
        if (e.source === id) s.add(e.target);
        if (e.target === id) s.add(e.source);
      }
      return s;
    },
    [edges],
  );

  const [catFilter, setCatFilter] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<string | null>(null);
  const [showIsolated, setShowIsolated] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [hover, setHover] = React.useState<string | null>(null);
  const drag = React.useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const visibleNodes = React.useMemo(() => {
    let list = nodes;
    if (catFilter) list = list.filter((n) => n.category === catFilter);
    if (focus) {
      const nb = neighborsOf(focus);
      list = list.filter((n) => nb.has(n.id));
    } else if (!showIsolated) {
      list = list.filter((n) => (degree.get(n.id) ?? 0) > 0);
    }
    return list;
  }, [nodes, catFilter, focus, showIsolated, degree, neighborsOf]);

  const visibleIds = React.useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = React.useMemo(
    () => edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [edges, visibleIds],
  );

  const pos = React.useMemo(
    () => computeLayout(visibleNodes, visibleEdges),
    [visibleNodes, visibleEdges],
  );

  const hiddenCount = nodes.length - visibleNodes.length;
  const labelAll = focus !== null || visibleNodes.length <= 38;

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setCatFilter(null); setFocus(null); }}
          className={cn("rounded-full border px-2.5 py-1 text-xs", !catFilter && !focus && "border-primary bg-primary text-primary-foreground")}
        >
          Hamısı
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => { setCatFilter((f) => (f === c ? null : c)); setFocus(null); }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
              catFilter === c && "border-primary bg-primary text-primary-foreground",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: colorByCat.get(c) }} />
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-8 min-w-[220px] rounded-md border border-input bg-background px-2 text-xs"
          value={focus ?? ""}
          onChange={(e) => setFocus(e.target.value || null)}
        >
          <option value="">— termini fokusla —</option>
          {[...nodes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
        </select>

        {!focus && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={showIsolated} onChange={(e) => setShowIsolated(e.target.checked)} className="accent-primary" />
            təcrid olunmuş terminlər ({nodes.length - [...degree.keys()].length})
          </label>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button className="rounded border px-2 py-1 text-xs" onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))}>−</button>
          <button className="rounded border px-2 py-1 text-xs tabular-nums" onClick={resetView}>{Math.round(zoom * 100)}%</button>
          <button className="rounded border px-2 py-1 text-xs" onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}>+</button>
          {(focus || catFilter || zoom !== 1 || pan.x || pan.y) && (
            <button className="rounded border px-2 py-1 text-xs" onClick={() => { setFocus(null); setCatFilter(null); resetView(); }}>
              Sıfırla
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {visibleNodes.length} node · {visibleEdges.length} əlaqə
        {hiddenCount > 0 && !focus ? ` · ${hiddenCount} gizli` : ""}
        {focus ? " · fokus rejimi" : ""} — node-a klik: fokusla · boşluğu sürüklə: hərəkət · təkər: yaxınlaşdır
      </p>

      <div className="overflow-hidden rounded-xl border bg-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[70vh] max-h-[760px] w-full touch-none select-none"
          style={{ cursor: drag.current ? "grabbing" : "grab" }}
          onWheel={(e) => {
            const factor = e.deltaY < 0 ? 1.12 : 0.89;
            setZoom((z) => Math.max(0.3, Math.min(3, +(z * factor).toFixed(3))));
          }}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const sx = W / rect.width;
            const sy = H / rect.height;
            setPan({
              x: drag.current.px + (e.clientX - drag.current.x) * sx,
              y: drag.current.py + (e.clientY - drag.current.y) * sy,
            });
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerLeave={() => { drag.current = null; }}
        >
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {visibleEdges.map((e) => {
              const a = pos.get(e.source);
              const b = pos.get(e.target);
              if (!a || !b) return null;
              const active = !!focus && (e.source === focus || e.target === focus);
              return (
                <g key={e.id}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="hsl(var(--foreground))"
                    strokeOpacity={active ? 0.35 : focus ? 0.08 : 0.12}
                    strokeWidth={active ? 1.5 : 1}
                  />
                  {(active || (!focus && visibleEdges.length <= 22)) && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2}
                      fontSize={8}
                      fill="hsl(var(--muted-foreground))"
                      textAnchor="middle"
                    >
                      {RELATION_LABEL[e.type] ?? e.type}
                    </text>
                  )}
                </g>
              );
            })}

            {visibleNodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const r = 5 + n.importance * 1.7;
              const isFocus = focus === n.id;
              const dim = !!focus && !isFocus;
              const showLabel = labelAll || isFocus || hover === n.id || n.importance >= 4;
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x} ${p.y})`}
                  className="cursor-pointer"
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocus((f) => (f === n.id ? null : n.id));
                  }}
                >
                  <circle
                    r={r}
                    fill={n.color}
                    fillOpacity={dim ? 0.45 : 0.95}
                    stroke={isFocus ? "hsl(var(--primary))" : "white"}
                    strokeWidth={isFocus ? 3 : 1.25}
                  />
                  {showLabel && (
                    <text
                      x={r + 4}
                      y={4}
                      fontSize={11}
                      fill="hsl(var(--foreground))"
                      fillOpacity={dim ? 0.5 : 1}
                      style={{ paintOrder: "stroke", stroke: "hsl(var(--card))", strokeWidth: 3 }}
                    >
                      {n.name.length > 34 ? n.name.slice(0, 33) + "…" : n.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {focus && (
        <div className="rounded-lg border p-3 text-sm">
          {(() => {
            const node = nodes.find((n) => n.id === focus);
            if (!node) return null;
            const nb = neighborsOf(focus);
            return (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{node.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {node.category} · vaciblik {node.importance}/5 · {nb.size - 1} əlaqəli termin
                  </p>
                </div>
                <Link href={`/terms/${node.slug}`} className="text-xs text-primary underline">
                  Termin səhifəsi →
                </Link>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
