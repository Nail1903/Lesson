"use client";

import * as React from "react";
import Link from "next/link";
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

interface Pos {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const W = 900;
const H = 620;

/** Tiny deterministic force-directed layout — no external dependency. */
function layout(nodes: GNode[], edges: GEdge[]): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const n = nodes.length;
  nodes.forEach((node, i) => {
    const angle = (i / n) * Math.PI * 2;
    pos.set(node.id, {
      x: W / 2 + Math.cos(angle) * 220 + (i % 3) * 12,
      y: H / 2 + Math.sin(angle) * 180 + (i % 5) * 10,
      vx: 0,
      vy: 0,
    });
  });

  const adj = edges
    .filter((e) => pos.has(e.source) && pos.has(e.target))
    .map((e) => [e.source, e.target] as const);

  for (let iter = 0; iter < 300; iter++) {
    // repulsion
    for (let i = 0; i < n; i++) {
      const a = pos.get(nodes[i]!.id)!;
      for (let j = i + 1; j < n; j++) {
        const b = pos.get(nodes[j]!.id)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy || 0.01;
        const f = 2600 / d2;
        const d = Math.sqrt(d2);
        dx /= d;
        dy /= d;
        a.vx += dx * f;
        a.vy += dy * f;
        b.vx -= dx * f;
        b.vy -= dy * f;
      }
    }
    // springs
    for (const [s, t] of adj) {
      const a = pos.get(s)!;
      const b = pos.get(t)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - 120) * 0.02;
      const ux = dx / d;
      const uy = dy / d;
      a.vx += ux * f;
      a.vy += uy * f;
      b.vx -= ux * f;
      b.vy -= uy * f;
    }
    // centering + integrate
    for (const node of nodes) {
      const p = pos.get(node.id)!;
      p.vx += (W / 2 - p.x) * 0.002;
      p.vy += (H / 2 - p.y) * 0.002;
      p.x += Math.max(-12, Math.min(12, p.vx));
      p.y += Math.max(-12, Math.min(12, p.vy));
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x = Math.max(30, Math.min(W - 30, p.x));
      p.y = Math.max(30, Math.min(H - 30, p.y));
    }
  }
  return pos;
}

export function KnowledgeGraph({ nodes, edges }: { nodes: GNode[]; edges: GEdge[] }) {
  const categories = React.useMemo(
    () => Array.from(new Set(nodes.map((n) => n.category))),
    [nodes],
  );
  const colorByCat = React.useMemo(() => {
    const m = new Map<string, string>();
    nodes.forEach((n) => m.set(n.category, n.color));
    return m;
  }, [nodes]);

  const [catFilter, setCatFilter] = React.useState<string | null>(null);
  const [focus, setFocus] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);

  const visibleNodes = React.useMemo(() => {
    let list = nodes;
    if (catFilter) list = list.filter((n) => n.category === catFilter);
    if (focus) {
      const neighborIds = new Set<string>([focus]);
      edges.forEach((e) => {
        if (e.source === focus) neighborIds.add(e.target);
        if (e.target === focus) neighborIds.add(e.source);
      });
      list = list.filter((n) => neighborIds.has(n.id));
    }
    return list;
  }, [nodes, edges, catFilter, focus]);

  const visibleIds = React.useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = React.useMemo(
    () => edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [edges, visibleIds],
  );

  const pos = React.useMemo(() => layout(visibleNodes, visibleEdges), [visibleNodes, visibleEdges]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCatFilter(null)}
          className={cn("rounded-full border px-2.5 py-1 text-xs", !catFilter && "border-primary bg-primary text-primary-foreground")}
        >
          Hamısı
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter((f) => (f === c ? null : c))}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
              catFilter === c && "border-primary bg-primary text-primary-foreground",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: colorByCat.get(c) }} />
            {c}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button className="rounded border px-2 py-1 text-xs" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}>−</button>
          <button className="rounded border px-2 py-1 text-xs" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button className="rounded border px-2 py-1 text-xs" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}>+</button>
          {focus && (
            <button className="rounded border px-2 py-1 text-xs" onClick={() => setFocus(null)}>Fokusu sıfırla</button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[620px] w-full"
          onWheel={(e) => {
            setZoom((z) => Math.max(0.5, Math.min(2.5, z - e.deltaY * 0.001)));
          }}
        >
          <g transform={`translate(${W / 2} ${H / 2}) scale(${zoom}) translate(${-W / 2} ${-H / 2})`}>
            {visibleEdges.map((e) => {
              const a = pos.get(e.source);
              const b = pos.get(e.target);
              if (!a || !b) return null;
              return (
                <g key={e.id}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--border))" strokeWidth={1.5} />
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2}
                    fontSize={8}
                    fill="hsl(var(--muted-foreground))"
                    textAnchor="middle"
                  >
                    {RELATION_LABEL[e.type] ?? e.type}
                  </text>
                </g>
              );
            })}
            {visibleNodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const r = 6 + n.importance * 1.6;
              return (
                <g key={n.id} transform={`translate(${p.x} ${p.y})`} className="cursor-pointer">
                  <circle
                    r={r}
                    fill={n.color}
                    fillOpacity={focus && focus !== n.id ? 0.5 : 0.9}
                    stroke={focus === n.id ? "hsl(var(--primary))" : "white"}
                    strokeWidth={focus === n.id ? 3 : 1.5}
                    onClick={() => setFocus((f) => (f === n.id ? null : n.id))}
                  />
                  <text x={r + 3} y={4} fontSize={11} fill="hsl(var(--foreground))">
                    {n.name}
                  </text>
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
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{node.name}</p>
                  <p className="text-xs text-muted-foreground">{node.category} · vaciblik {node.importance}/5</p>
                </div>
                <Link href={`/terms/${node.slug}`} className="text-xs text-primary underline">Termin səhifəsi →</Link>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
