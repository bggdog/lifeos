import { Button, Modal, Text, useOverlayState } from '@heroui/react'

type Props = {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  danger?: boolean
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  onConfirm,
  onOpenChange,
  danger = true,
}: Props) {
  const state = useOverlayState({
    isOpen: open,
    onOpenChange,
  })

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop
        variant="opaque"
        isDismissable
        className="z-[400] !bg-[rgba(0,0,0,0.45)] [backdrop-filter:none]"
      >
        <Modal.Container
          placement="center"
          className="z-[400] w-full max-w-md p-4 data-[entering]:!animate-none data-[exiting]:!animate-none"
        >
          <Modal.Dialog className="overflow-hidden rounded-2xl border border-border/60 !bg-background shadow-xl">
            <Modal.Header className="border-b border-border/50 px-5 py-4">
              <Modal.Heading className="text-lg font-medium tracking-tight">
                {title}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="px-5 py-4">
              <Text className="text-sm leading-relaxed text-foreground/75">{body}</Text>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-border/50 px-5 py-3">
              <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className={
                  danger
                    ? 'rounded-full border-danger/40 text-danger hover:bg-danger/10'
                    : 'rounded-full'
                }
                onPress={() => {
                  onConfirm()
                  onOpenChange(false)
                }}
              >
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  )
}
