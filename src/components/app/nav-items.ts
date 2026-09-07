import {
  LayoutDashboard,
  CalendarDays,
  FolderTree,
  FileStack,
  Repeat2,
  MessageSquareText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "planlama" | "şəxsi";
}

/**
 * The app is a teacher's lesson-planning workspace. Primary flow: weekly
 * planner → subject content (lessons, terms). Term-learning is a personal side
 * feature. Advanced pages live under Parametrlər.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "İdarə paneli", icon: LayoutDashboard, group: "planlama" },
  { href: "/schedule", label: "Tədris Planlayıcısı", icon: CalendarDays, group: "planlama" },
  { href: "/subjects", label: "Fənnlər və dərslər", icon: FolderTree, group: "planlama" },
  { href: "/question-bank", label: "Sual bankı", icon: FileStack, group: "planlama" },

  { href: "/learn", label: "Öyrənmə seansı", icon: Repeat2, group: "şəxsi" },
  { href: "/assistant", label: "Bilik köməkçisi", icon: MessageSquareText, group: "şəxsi" },

  { href: "/settings", label: "Parametrlər", icon: Settings, group: "şəxsi" },
];

/** Reachable but not in the sidebar — surfaced from Parametrlər and in-context. */
export const SECONDARY_LINKS: { href: string; label: string }[] = [
  { href: "/teaching", label: "Semestr / qrup idarəetməsi (ətraflı)" },
  { href: "/terms", label: "Bütün terminlər" },
  { href: "/quizzes", label: "Test mərkəzi" },
  { href: "/graph", label: "Bilik qrafı" },
  { href: "/collections", label: "Kolleksiyalar" },
  { href: "/sources", label: "Fayllar və mənbələr" },
  { href: "/stats", label: "Statistika" },
  { href: "/history", label: "Sual-cavab tarixçəsi" },
  { href: "/import-export", label: "Import / Export" },
  { href: "/trash", label: "Səbət" },
];
