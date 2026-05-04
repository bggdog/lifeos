import {
  Button,
  Card,
  Text,
} from '@heroui/react'
import { motion } from 'framer-motion'
import { Navigate, useNavigate } from 'react-router-dom'
import type { LifeOsUser } from '../context/UserContext'
import { useUser } from '../context/UserContext'

function UserCard({
  user,
  onSignIn,
}: {
  user: LifeOsUser
  onSignIn: (u: LifeOsUser) => void
}) {
  const accent =
    user === 'Branson'
      ? 'from-violet-100/90 to-fuchsia-50/70 ring-violet-200/80 dark:from-violet-950/50 dark:to-fuchsia-950/30 dark:ring-violet-800/50'
      : 'from-rose-100/90 to-amber-50/70 ring-rose-200/80 dark:from-rose-950/45 dark:to-amber-950/25 dark:ring-rose-800/50'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm"
    >
      <Card.Root
        variant="default"
        className={`overflow-hidden border border-border/60 bg-gradient-to-br shadow-sm ring-1 ${accent}`}
      >
        <Card.Content className="flex flex-col items-center gap-5 px-8 py-10">
          <div
            className={`flex size-20 items-center justify-center rounded-full text-2xl font-semibold tracking-tight text-foreground shadow-inner ${
              user === 'Branson'
                ? 'bg-violet-200/80 dark:bg-violet-800/70'
                : 'bg-rose-200/80 dark:bg-rose-800/70'
            }`}
          >
            {user[0]}
          </div>
          <Text className="text-2xl font-medium tracking-tight text-foreground">
            {user}
          </Text>
          <Button
            variant="primary"
            className="w-full rounded-full"
            onPress={() => onSignIn(user)}
          >
            Sign in
          </Button>
        </Card.Content>
      </Card.Root>
    </motion.div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { activeUser, setActiveUser } = useUser()

  if (activeUser) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSignIn = (user: LifeOsUser) => {
    setActiveUser(user)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-rose-50 via-background to-violet-50/80 px-4 py-12 dark:from-rose-950/25 dark:via-background dark:to-violet-950/20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(244,114,182,0.2), transparent 42%), radial-gradient(circle at 80% 10%, rgba(167,139,250,0.22), transparent 40%)',
        }}
      />
      <div className="relative z-[1] flex w-full max-w-3xl flex-col items-center gap-10">
        <div className="text-center">
          <Text className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            LifeOS
          </Text>
          <Text className="mt-2 text-base text-foreground/65">
            Your shared space for the life you&apos;re building together.
          </Text>
        </div>
        <div className="grid w-full gap-6 sm:grid-cols-2 sm:gap-8">
          <UserCard user="Branson" onSignIn={handleSignIn} />
          <UserCard user="Kelsee" onSignIn={handleSignIn} />
        </div>
      </div>
    </div>
  )
}
