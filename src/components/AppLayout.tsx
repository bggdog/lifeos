import {
  Avatar,
  Button,
  Separator,
  Surface,
  Tooltip,
} from '@heroui/react'
import {
  Calendar,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Shield,
  Sun,
  Target,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { todayLocalISO, useHeartCheckIn } from '../context/HeartCheckInContext'
import type { LifeOsUser } from '../context/UserContext'
import { useUser } from '../context/UserContext'
import { useHeroUITheme } from '../hooks/use-hero-ui-theme'

type NavItem = {
  to: string
  label: string
  icon: typeof Calendar
  hearts?: boolean
  kelseeOnly?: boolean
}

const baseNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/hearts', label: 'Hearts', icon: Heart, hearts: true },
  { to: '/warranty', label: 'Warranty', icon: Shield, kelseeOnly: true },
]

function useDocumentDark() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const el = document.documentElement
    const sync = () => setDark(el.classList.contains('dark'))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return dark
}

function partnerOf(user: LifeOsUser): LifeOsUser {
  return user === 'Branson' ? 'Kelsee' : 'Branson'
}

function addDaysToISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function relativeCheckInLabel(dateISO: string): string {
  const today = todayLocalISO()
  const yday = addDaysToISO(today, -1)
  if (dateISO === today) return 'Today'
  if (dateISO === yday) return 'Yesterday'
  const [y, m, d] = dateISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function truncate(s: string, max: number) {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function NavLinks({
  className,
  items,
  pulseHearts,
}: {
  className?: string
  items: NavItem[]
  pulseHearts: boolean
}) {
  const { pathname } = useLocation()

  return (
    <div className={className}>
      {items.map(({ to, label, icon: Icon, hearts }) => {
        const active = pathname === to
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className="relative z-[1] flex size-12 cursor-pointer touch-manipulation items-center justify-center rounded-xl text-foreground/55 transition-colors hover:bg-accent/45 hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.75} />
            {hearts && pulseHearts ? (
              <span
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-pink-500 shadow-[0_0_0_4px_rgba(236,72,153,0.28)] motion-safe:animate-pulse"
                aria-hidden
              />
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}

const PARTNER_COLOR: Record<LifeOsUser, string> = {
  Branson: '#534AB7',
  Kelsee: '#C2185B',
}

function PartnerHeartWidget({ activeUser }: { activeUser: LifeOsUser }) {
  const partner = partnerOf(activeUser)
  const { getLatestPartnerCheckIn, unreadPartnerCount } = useHeartCheckIn()
  const latest = getLatestPartnerCheckIn()
  const hasUnread = unreadPartnerCount > 0
  const color = PARTNER_COLOR[partner]

  const tooltipBody = useMemo(() => {
    if (!latest) {
      return (
        <p className="text-sm text-foreground/75">
          {partner} hasn&apos;t checked in yet
        </p>
      )
    }
    const preview = truncate(latest.text, 100)
    return (
      <div className="space-y-2 py-0.5">
        <p className="text-sm font-semibold text-foreground">
          {partner} · {relativeCheckInLabel(latest.date)}
        </p>
        <p className="text-xs leading-relaxed text-foreground/70">{preview}</p>
        <Link
          to="/hearts"
          className="inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline"
        >
          See all
        </Link>
      </div>
    )
  }, [latest, partner])

  return (
    <Tooltip.Root delay={180} closeDelay={100}>
      <Tooltip.Trigger
        className={`flex w-full flex-col items-center rounded-xl border border-border/40 bg-background/50 p-1.5 outline-none transition-opacity hover:bg-background/80 dark:bg-background/25 dark:hover:bg-background/40 ${
          !latest ? 'opacity-55' : ''
        }`}
        aria-label={`${partner} heart check-in preview`}
      >
        <div
          className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {partner[0]}
        </div>
        {hasUnread ? (
          <span className="mt-1 h-1 w-6 rounded-full bg-pink-400/90" aria-hidden />
        ) : (
          <span className="mt-1 h-1 w-6 rounded-full bg-transparent" aria-hidden />
        )}
      </Tooltip.Trigger>
      <Tooltip.Content
        placement="right"
        offset={10}
        className="max-w-[min(260px,calc(100vw-4rem))] border border-border/50 bg-background px-3 py-2 shadow-lg"
      >
        {tooltipBody}
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeUser, logout } = useUser()
  const { unreadPartnerCount } = useHeartCheckIn()
  const { setTheme } = useHeroUITheme()
  const isDark = useDocumentDark()

  const navItems = useMemo(() => {
    return baseNav.filter((i) => !i.kelseeOnly || activeUser === 'Kelsee')
  }, [activeUser])

  const pulseHearts = Boolean(activeUser) && unreadPartnerCount > 0

  return (
    <div className="relative flex min-h-0 w-full flex-1 bg-background text-foreground">
      <Surface
        role="complementary"
        aria-label="Main navigation"
        variant="secondary"
        className="sticky top-0 z-30 hidden h-auto min-h-0 max-h-dvh w-16 shrink-0 flex-col items-center self-stretch border-r border-border py-3 md:flex"
      >
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-hidden">
          <NavLinks
            className="flex shrink-0 flex-col items-center gap-1"
            items={navItems}
            pulseHearts={pulseHearts}
          />
        </div>

        <div className="mt-auto flex w-full flex-col items-center gap-2 px-1 pb-1">
          {activeUser ? (
            <>
              <Separator className="mb-1 w-8 opacity-40" />
              <PartnerHeartWidget activeUser={activeUser} />
            </>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            isIconOnly
            size="sm"
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
            className="text-foreground/55"
            onPress={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <div className="flex flex-col items-center gap-1.5 pb-0.5">
            <Avatar.Root size="sm" className="ring-2 ring-rose-200/70 dark:ring-rose-900/60">
              <Avatar.Fallback className="text-xs font-medium">
                {activeUser?.[0] ?? '?'}
              </Avatar.Fallback>
            </Avatar.Root>
            <Button
              type="button"
              variant="ghost"
              isIconOnly
              size="sm"
              aria-label="Sign out"
              className="text-foreground/55"
              onPress={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </Surface>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <main className="flex min-h-0 flex-1 flex-col">
          <div key={location.pathname} className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      <Surface
        role="navigation"
        aria-label="Primary"
        variant="secondary"
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[100] flex h-[3.75rem] items-stretch justify-around border-t border-border px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
      >
        <NavLinks
          className="flex w-full max-w-lg items-center justify-around"
          items={navItems}
          pulseHearts={pulseHearts}
        />
      </Surface>
    </div>
  )
}
