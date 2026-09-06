import {
  LayoutDashboard,
  Library,
  FolderTree,
  Boxes,
  Network,
  MessageSquareText,
  GraduationCap,
  Repeat2,
  FileText,
  BarChart3,
  History,
  Settings,
  ArrowLeftRight,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "əsas" | "öyrənmə" | "sistem";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "İdarə paneli", icon: LayoutDashboard, group: "əsas" },
  { href: "/terms", label: "Bütün terminlər", icon: Library, group: "əsas" },
  { href: "/subjects", label: "Fənnlər və mövzular", icon: FolderTree, group: "əsas" },
  { href: "/collections", label: "Kolleksiyalar", icon: Boxes, group: "əsas" },
  { href: "/graph", label: "Bilik qrafı", icon: Network, group: "əsas" },

  { href: "/learn", label: "Öyrənmə seansı", icon: Repeat2, group: "öyrənmə" },
  { href: "/quizzes", label: "Test mərkəzi", icon: GraduationCap, group: "öyrənmə" },
  { href: "/assistant", label: "Bilik köməkçisi", icon: MessageSquareText, group: "öyrənmə" },
  { href: "/sources", label: "Fayllar və mənbələr", icon: FileText, group: "öyrənmə" },
  { href: "/stats", label: "Statistika", icon: BarChart3, group: "öyrənmə" },

  { href: "/history", label: "Sual-cavab tarixçəsi", icon: History, group: "sistem" },
  { href: "/import-export", label: "Import / Export", icon: ArrowLeftRight, group: "sistem" },
  { href: "/trash", label: "Səbət", icon: Trash2, group: "sistem" },
  { href: "/settings", label: "Profil və parametrlər", icon: Settings, group: "sistem" },
];
