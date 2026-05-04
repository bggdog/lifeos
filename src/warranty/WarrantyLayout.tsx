import {
  Building2,
  ClipboardList,
  Hammer,
  Home,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const nav = [
  { to: '/warranty', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/warranty/communities', label: 'Communities', icon: Building2 },
  { to: '/warranty/homes', label: 'Homes', icon: Home },
  { to: '/warranty/tickets', label: 'Tickets', icon: ClipboardList },
  { to: '/warranty/contractors', label: 'Contractors', icon: Hammer },
  { to: '/warranty/reports', label: 'Reports', icon: Users },
  { to: '/warranty/settings', label: 'Settings', icon: Settings },
] as const

function SubNavLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors md:w-full md:px-2.5 md:py-1.5 ${
          isActive
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'border-transparent text-foreground/65 hover:border-border hover:bg-surface/80 hover:text-foreground'
        }`
      }
    >
      <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
      <span className="whitespace-nowrap">{label}</span>
    </NavLink>
  )
}

export function WarrantyLayout() {
  const location = useLocation()

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-0 bg-background text-foreground md:flex-row"
      data-warranty-shell
    >
      <nav
        aria-label="Warranty sections"
        className="warranty-print-hide no-scrollbar flex gap-1 overflow-x-auto border-b border-border/80 bg-surface/40 px-2 py-2 md:w-52 md:shrink-0 md:flex-col md:gap-0.5 md:border-b-0 md:border-r md:px-2 md:py-3"
      >
        <div className="mb-2 hidden px-1 md:block">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
            Warranty
          </p>
          <p className="text-xs font-medium text-foreground/70">Management</p>
        </div>
        {nav.map((item) => (
          <SubNavLink key={item.to} {...item} />
        ))}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
