import {
  Button,
  Label,
  Modal,
  Text,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  greetingForUser,
  todayLocalISO,
  useHeartCheckIn,
} from '../context/HeartCheckInContext'
import type { LifeOsUser } from '../context/UserContext'
import { useUser } from '../context/UserContext'

function HeartCheckInModalContent({
  activeUser,
  isExiting,
  onSubmit,
  onSkip,
}: {
  activeUser: LifeOsUser
  isExiting: boolean
  onSubmit: (text: string) => void
  onSkip: () => void
}) {
  const [text, setText] = useState('')

  return (
    <Modal.Dialog className="overflow-hidden !bg-background !p-0 rounded-2xl border border-border/60 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.28)] ring-1 ring-black/5 dark:ring-white/10 dark:shadow-[0_16px_48px_-10px_rgba(0,0,0,0.65)]">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={
          isExiting
            ? { opacity: 0, scale: 0.96 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      >
        <Modal.Header className="border-b border-border/35 bg-gradient-to-br from-rose-50/85 to-violet-50/75 px-4 py-3.5 dark:from-rose-950/35 dark:to-violet-950/25">
          <div className="space-y-1">
            <Modal.Heading className="text-lg font-semibold tracking-tight text-foreground">
              {greetingForUser(activeUser)}
            </Modal.Heading>
            <Text className="text-[13px] font-normal leading-snug text-foreground/68">
              Optional check-in — share how you&apos;re doing when it feels right.
            </Text>
          </div>
        </Modal.Header>
        <Modal.Body className="space-y-3 px-4 py-4">
          <TextField name="heart" className="w-full">
            <Label className="sr-only">Heart check-in</Label>
            <TextArea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely — just for the two of you…"
              rows={4}
              className="min-h-[96px] w-full resize-y rounded-xl border border-border/70 bg-surface text-[14px] leading-relaxed"
            />
          </TextField>
        </Modal.Body>
        <Modal.Footer className="flex items-center justify-between gap-2 border-t border-border/35 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-foreground/60"
            onPress={onSkip}
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="min-w-[5.5rem] rounded-full px-4"
            onPress={() => onSubmit(text)}
            isDisabled={text.trim().length < 1}
          >
            Submit
          </Button>
        </Modal.Footer>
      </motion.div>
    </Modal.Dialog>
  )
}

function skipHeartStorageKey(user: LifeOsUser): string {
  return `lifeos.skipHeart.${user}.${todayLocalISO()}`
}

export function HeartCheckInModal() {
  const navigate = useNavigate()
  const { activeUser } = useUser()
  const { hasCheckedInToday, submitCheckIn } = useHeartCheckIn()
  const [isExiting, setIsExiting] = useState(false)
  /** Forces re-render after Skip so `sessionStorage` skip is picked up without relying on route changes. */
  const [skipBump, setSkipBump] = useState(0)

  const skipped =
    activeUser != null &&
    globalThis.sessionStorage.getItem(skipHeartStorageKey(activeUser)) === '1'

  const mustPrompt = Boolean(
    activeUser && !hasCheckedInToday(activeUser) && !skipped,
  )
  const visible = Boolean(activeUser) && (mustPrompt || isExiting)

  const state = useOverlayState({
    isOpen: visible,
    onOpenChange: () => {},
  })

  const handleSkip = () => {
    if (!activeUser || isExiting) return
    globalThis.sessionStorage.setItem(skipHeartStorageKey(activeUser), '1')
    setSkipBump((n) => n + 1)
    navigate('/dashboard', { replace: true })
  }

  const handleSubmit = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed.length < 1 || isExiting) return
    setIsExiting(true)
    globalThis.setTimeout(() => {
      submitCheckIn(trimmed)
      toast.success('Check-in saved 💛', { timeout: 2000 })
      setIsExiting(false)
      navigate('/dashboard', { replace: true })
    }, 320)
  }

  if (!activeUser) return null
  /** Do not mount Modal when closed — a mounted closed Modal can leave a full-screen invisible layer. */
  if (!visible) return null

  return (
    <Modal.Root state={state}>
      {/*
        Fully transparent overlay: app stays sharp (no blur / dim “sheet”).
        Disable overlay zoom/fade animations so it feels like a small popup, not a route change.
      */}
      <Modal.Backdrop
        variant="transparent"
        isDismissable={false}
        isKeyboardDismissDisabled
        className="pointer-events-none z-[200] !bg-transparent ![backdrop-filter:none] [-webkit-backdrop-filter:none] data-[entering]:!animate-none data-[exiting]:!animate-none"
      />
      <Modal.Container
        placement="center"
        size="xs"
        scroll="inside"
        className="pointer-events-none z-[200] flex min-h-[100dvh] w-full max-w-none flex-col items-center justify-center px-3 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] data-[entering]:!animate-none data-[exiting]:!animate-none md:py-6 [&>*]:pointer-events-auto [&>*]:w-[min(22rem,calc(100vw-1.25rem))]"
      >
        <HeartCheckInModalContent
          key={`${activeUser}-${todayLocalISO()}-${skipBump}`}
          activeUser={activeUser}
          isExiting={isExiting}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
        />
      </Modal.Container>
    </Modal.Root>
  )
}
