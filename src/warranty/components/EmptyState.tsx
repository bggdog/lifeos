import { Button, Text } from '@heroui/react'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-surface/30 px-6 py-14 text-center">
      <Text className="text-base font-medium text-foreground">{title}</Text>
      <Text className="max-w-sm text-sm text-foreground/60">{description}</Text>
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" className="mt-1 rounded-full" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
