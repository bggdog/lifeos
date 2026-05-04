import { Button, Input, Label, Text, TextField } from '@heroui/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { COLOR_SWATCHES, STATUS_COLOR_CLASS, SWATCH_CLASS } from '../statusStyles'
import { useWarranty } from '../WarrantyContext'
import type { StatusConfigItem } from '../types'
import { newId, sortStatusConfig } from '../utils'

const SW_DOT: Record<string, string> = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  gray: 'bg-neutral-400',
  green: 'bg-emerald-500',
  slate: 'bg-slate-600',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
}

function slugLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || `status-${newId().slice(0, 8)}`
}

function SortableRow({
  item,
  onLabelBlur,
  onPickColor,
  onDelete,
}: {
  item: StatusConfigItem
  onLabelBlur: (id: string, label: string) => void
  onPickColor: (id: string, color: string) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }
  const chip =
    STATUS_COLOR_CLASS[item.color] ?? SWATCH_CLASS[item.color] ?? STATUS_COLOR_CLASS.gray

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-surface/40 px-2 py-2"
    >
      <button
        type="button"
        className="cursor-grab rounded p-1 text-foreground/45 hover:bg-foreground/10"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <TextField name={`label-${item.id}`} className="min-w-[8rem] flex-1">
        <Label className="sr-only">Label</Label>
        <Input
          defaultValue={item.label}
          className="text-sm font-medium"
          onBlur={(e) => onLabelBlur(item.id, e.target.value)}
        />
      </TextField>
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chip}`}>
        Preview
      </span>
      <div className="flex flex-wrap gap-1">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onPickColor(item.id, c)}
            className={`size-6 rounded-full border-2 ${
              item.color === c ? 'border-foreground ring-2 ring-primary/30' : 'border-transparent'
            } ${SW_DOT[c] ?? 'bg-neutral-400'}`}
          />
        ))}
      </div>
      <Button variant="ghost" size="sm" isIconOnly onPress={() => onDelete(item.id)}>
        <Trash2 className="size-4 text-danger" />
      </Button>
    </div>
  )
}

export default function WarrantySettingsPage() {
  const { tickets, statusConfig, setStatusConfig } = useWarranty()
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState<string>(COLOR_SWATCHES[0])
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const ordered = sortStatusConfig(statusConfig)

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const items = sortStatusConfig(statusConfig)
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(items, oldIndex, newIndex).map((s, order) => ({ ...s, order }))
    setStatusConfig(next)
  }

  const onLabelBlur = (id: string, label: string) => {
    const t = label.trim()
    if (!t) return
    setStatusConfig(
      statusConfig.map((s) => (s.id === id ? { ...s, label: t } : s)),
    )
  }

  const onPickColor = (id: string, color: string) => {
    setStatusConfig(
      statusConfig.map((s) => (s.id === id ? { ...s, color } : s)),
    )
  }

  const addStatus = () => {
    const label = newLabel.trim()
    if (!label) return
    const id = slugLabel(label)
    if (statusConfig.some((s) => s.id === id)) {
      return
    }
    const order = statusConfig.length
    setStatusConfig([...statusConfig, { id, label, color: newColor, order }])
    setNewLabel('')
  }

  const requestDelete = (id: string) => {
    const count = tickets.filter((t) => t.status === id).length
    if (count > 0) {
      setPendingDelete(id)
      return
    }
    setStatusConfig(statusConfig.filter((s) => s.id !== id))
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    setStatusConfig(statusConfig.filter((s) => s.id !== pendingDelete))
    setPendingDelete(null)
  }

  const blockedCount = pendingDelete
    ? tickets.filter((t) => t.status === pendingDelete).length
    : 0

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
      <header>
        <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
          Configuration
        </Text>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Ticket statuses</h1>
        <Text className="mt-1 text-sm text-foreground/55">
          Drag to reorder. Labels and colors save immediately. Deleting a status in use requires
          confirmation.
        </Text>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ordered.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {ordered.map((s) => (
              <SortableRow
                key={s.id}
                item={s}
                onLabelBlur={onLabelBlur}
                onPickColor={onPickColor}
                onDelete={requestDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="rounded-xl border border-border/60 bg-surface/30 p-4">
        <Text className="text-sm font-semibold text-foreground">Add status</Text>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <TextField name="newlabel" className="min-w-[12rem] flex-1">
            <Label>Name</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          </TextField>
          <div>
            <Label className="mb-1.5 block text-xs text-foreground/60">Color</Label>
            <div className="flex flex-wrap gap-1">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`size-7 rounded-full border-2 ${
                    newColor === c ? 'border-foreground' : 'border-transparent'
                  } ${SW_DOT[c] ?? 'bg-neutral-400'}`}
                />
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" className="rounded-full" onPress={addStatus}>
            Add
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete status in use?"
        body={`${blockedCount} ticket(s) currently use this status. Deleting will leave their status string unchanged in storage — you should reassign them first for a clean workflow.`}
        confirmLabel="Delete anyway"
        onOpenChange={(v) => {
          if (!v) setPendingDelete(null)
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
