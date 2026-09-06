import { db } from "@/lib/db";

export async function getDashboardData(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 864e5);

  const [
    totalTerms,
    totalCategories,
    totalSubjects,
    addedToday,
    learnedThisWeek,
    dueCount,
    newCount,
    weakCount,
    weakTerms,
    recentTerms,
    recentChats,
    activityRaw,
    statusGroups,
    categoryGroups,
  ] = await Promise.all([
    db.term.count({ where: { userId, deletedAt: null } }),
    db.category.count({ where: { userId, deletedAt: null } }),
    db.subject.count({ where: { userId, deletedAt: null } }),
    db.term.count({ where: { userId, deletedAt: null, createdAt: { gte: startOfToday } } }),
    db.term.count({
      where: { userId, deletedAt: null, status: "UNDERSTOOD", updatedAt: { gte: weekAgo } },
    }),
    db.term.count({
      where: { userId, deletedAt: null, nextReviewAt: { lte: now } },
    }),
    db.term.count({ where: { userId, deletedAt: null, status: "NEW" } }),
    db.term.count({
      where: { userId, deletedAt: null, confidence: { lte: 2 }, status: { not: "NEW" } },
    }),
    db.term.findMany({
      where: { userId, deletedAt: null, confidence: { lte: 2 } },
      orderBy: [{ importance: "desc" }, { confidence: "asc" }],
      take: 6,
      select: { id: true, name: true, slug: true, confidence: true, importance: true, status: true },
    }),
    db.term.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, slug: true, updatedAt: true, status: true },
    }),
    db.chat.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
    }),
    db.userActivity.findMany({
      where: { userId, createdAt: { gte: new Date(now.getTime() - 30 * 864e5) } },
      select: { createdAt: true, type: true },
    }),
    db.term.groupBy({
      by: ["status"],
      where: { userId, deletedAt: null },
      _count: true,
    }),
    db.category.findMany({
      where: { userId, deletedAt: null },
      select: { name: true, color: true, _count: { select: { terms: true } } },
      orderBy: { terms: { _count: "desc" } },
      take: 8,
    }),
  ]);

  // last 14 days activity streak
  const byDay = new Map<string, number>();
  for (const a of activityRaw) {
    const key = a.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const streak: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10);
    streak.push({ date: d, count: byDay.get(d) ?? 0 });
  }

  return {
    totalTerms,
    totalCategories,
    totalSubjects,
    addedToday,
    learnedThisWeek,
    dueCount,
    newCount,
    weakCount,
    weakTerms,
    recentTerms,
    recentChats,
    streak,
    statusGroups: statusGroups.map((g) => ({ status: g.status, count: g._count })),
    categoryGroups,
  };
}
