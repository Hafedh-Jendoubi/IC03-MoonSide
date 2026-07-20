import {
  PenLine,
  Handshake,
  UserCheck,
  ShieldCheck,
  Pencil,
  BookOpen,
  Edit3,
  FileText,
  BookMarked,
  Trophy,
  Star,
  Users,
  Network,
  Globe,
  Building2,
  Zap,
  Flame,
  Calendar,
  CalendarCheck,
  Award,
  Medal,
  Crown,
} from 'lucide-react'

// We import every Lucide icon used by BadgeType so they're bundled at build time.
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  PenLine,
  Handshake,
  UserCheck,
  ShieldCheck,
  Pencil,
  BookOpen,
  Edit3,
  FileText,
  BookMarked,
  Trophy,
  Star,
  Users,
  Network,
  Globe,
  Building2,
  Zap,
  Flame,
  Calendar,
  CalendarCheck,
  Award,
  Medal,
  Crown,
}

/**
 * Renders a badge's icon from its stored Lucide icon name (e.g. "PenLine").
 * Falls back to the generic Award icon if the name isn't recognized.
 */
export function BadgeIcon({
  name,
  size = 28,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const Icon = ICON_MAP[name]
  if (!Icon) return <Award size={size} className={className} />
  return <Icon size={size} className={className} />
}
