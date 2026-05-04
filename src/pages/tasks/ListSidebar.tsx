import {
  Button,
  Dropdown,
  Input,
  Modal,
  Separator,
  Text,
  useOverlayState,
} from '@heroui/react'
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Check,
  GripVertical,
  MoreHorizontal,
  Plus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LifeOsUser } from '../../context/UserContext'
import type { Selection, Task, TaskList } from './types'
import {
  listIncompleteCount,
  otherHouseholdMember,
  selectionKey,
} from './types'

const SWATCHES = [
  '#7c3aed',
  '#0d9488',
  '#ea580c',
  '#2563eb',
  '#db2777',
  '#65a30d',
  '#57534e',
]

type Props = {
  activeUser: LifeOsUser
  lists: TaskList[]
  tasks: Task[]
  selection: Selection
  onSelect: (s: Selection) => void
  onReorderLists: (next: TaskList[]) => void
  onRenameList: (id: string, name: string) => void
  onSetListColor: (id: string, color: string) => void
  onDeleteList: (id: string) => void
  onAddList: (name: string) => void
  onShareList: (id: string) => void
  onUnshareList: (id: string) => void
}

function isActive(sel: Selection, s: Selection): boolean {
  return selectionKey(sel) === selectionKey(s)
}

function SortableListRow({
  list,
  count,
  selected,
  onSelect,
  onRename,
  onColor,
  onRequestDelete,
  isShared,
  partnerName,
  onRequestShare,
  onRequestUnshare,
  canUnshare,
}: {
  list: TaskList
  count: number
  selected: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onColor: (c: string) => void
  onRequestDelete: () => void
  isShared: boolean
  partnerName: string
  onRequestShare?: () => void
  onRequestUnshare?: () => void
  canUnshare: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameVal, setRenameVal] = useState(list.name)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-0.5 rounded-lg border px-0.5 py-0.5 ${
        selected
          ? 'border-primary/25 bg-primary/12'
          : 'border-transparent hover:bg-foreground/[0.04]'
      } ${isDragging ? 'z-10 shadow-lg ring-2 ring-primary/25' : ''}`}
    >
      <button
        type="button"
        className="touch-none rounded p-1 text-foreground/35 opacity-0 hover:bg-foreground/10 hover:text-foreground/70 group-hover:opacity-100"
        aria-label="Reorder list"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-1 text-left"
      >
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: list.color }}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {list.name}
        </span>
        {isShared ? (
          <span
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/12 px-1.5 py-px text-[10px] font-medium text-primary"
            title={`Shared with ${partnerName}`}
          >
            <Users className="size-3" aria-hidden />
            Shared
          </span>
        ) : null}
        <span className="shrink-0 rounded-full bg-foreground/10 px-1.5 py-px text-[11px] tabular-nums text-foreground/60">
          {count}
        </span>
      </button>
      <Dropdown.Root>
        <Dropdown.Trigger
          className="shrink-0 rounded-md p-1 text-foreground/45 opacity-0 hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100"
          aria-label="List options"
        >
          <MoreHorizontal className="size-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="min-w-[11rem]">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === 'rename') {
                setRenameVal(list.name)
                setRenameOpen(true)
              }
              if (key === 'delete') onRequestDelete()
              if (key === 'share') onRequestShare?.()
              if (key === 'unshare') onRequestUnshare?.()
              if (typeof key === 'string' && key.startsWith('color:')) {
                onColor(key.slice(6))
              }
            }}
          >
            <Dropdown.Item id="rename">Rename</Dropdown.Item>
            {!isShared && onRequestShare ? (
              <Dropdown.Item id="share">
                Share with {partnerName}
              </Dropdown.Item>
            ) : null}
            {isShared && canUnshare && onRequestUnshare ? (
              <Dropdown.Item id="unshare">Stop sharing</Dropdown.Item>
            ) : null}
            <Dropdown.Section aria-label="Colors">
              {SWATCHES.map((c) => (
                <Dropdown.Item key={c} id={`color:${c}`} textValue={c}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: c }}
                    />
                    {c}
                  </span>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
            <Dropdown.Item id="delete" className="text-danger">
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>

      {renameOpen ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 flex gap-1 rounded-lg border border-border bg-background p-2 shadow-md">
          <Input
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(renameVal.trim() || list.name)
                setRenameOpen(false)
              }
              if (e.key === 'Escape') setRenameOpen(false)
            }}
            autoFocus
            className="min-w-0 flex-1"
          />
          <Button
            size="sm"
            isIconOnly
            variant="primary"
            onPress={() => {
              onRename(renameVal.trim() || list.name)
              setRenameOpen(false)
            }}
          >
            <Check className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function ListSidebar({
  activeUser,
  lists,
  tasks,
  selection,
  onSelect,
  onReorderLists,
  onRenameList,
  onSetListColor,
  onDeleteList,
  onAddList,
  onShareList,
  onUnshareList,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<TaskList | null>(null)
  const [pendingShare, setPendingShare] = useState<TaskList | null>(null)
  const [pendingUnshare, setPendingUnshare] = useState<TaskList | null>(null)
  const delOverlay = useOverlayState({
    isOpen: pendingDelete != null,
    onOpenChange: (o) => {
      if (!o) setPendingDelete(null)
    },
  })
  const shareOverlay = useOverlayState({
    isOpen: pendingShare != null,
    onOpenChange: (o) => {
      if (!o) setPendingShare(null)
    },
  })
  const unshareOverlay = useOverlayState({
    isOpen: pendingUnshare != null,
    onOpenChange: (o) => {
      if (!o) setPendingUnshare(null)
    },
  })

  const partnerName = otherHouseholdMember(activeUser)

  const privateLists = useMemo(
    () => lists.filter((l) => !l.shared),
    [lists],
  )
  const sharedLists = useMemo(
    () => lists.filter((l) => l.shared),
    [lists],
  )

  const privateIds = useMemo(
    () => privateLists.map((l) => l.id),
    [privateLists],
  )
  const sharedIds = useMemo(
    () => sharedLists.map((l) => l.id),
    [sharedLists],
  )

  const onDragEndPrivate = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = privateIds.indexOf(String(active.id))
    const newIndex = privateIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const nextPrivate = arrayMove(privateLists, oldIndex, newIndex)
    onReorderLists([...nextPrivate, ...sharedLists])
  }

  const onDragEndShared = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = sharedIds.indexOf(String(active.id))
    const newIndex = sharedIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const nextShared = arrayMove(sharedLists, oldIndex, newIndex)
    onReorderLists([...privateLists, ...nextShared])
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border/50 bg-surface/30">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <Text className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
          Smart lists
        </Text>
        <button
          type="button"
          onClick={() => onSelect({ kind: 'smart', id: 'today' })}
          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium ${
            isActive(selection, { kind: 'smart', id: 'today' })
              ? 'bg-primary/12 text-primary'
              : 'text-foreground hover:bg-foreground/[0.05]'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onSelect({ kind: 'smart', id: 'upcoming' })}
          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium ${
            isActive(selection, { kind: 'smart', id: 'upcoming' })
              ? 'bg-primary/12 text-primary'
              : 'text-foreground hover:bg-foreground/[0.05]'
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => onSelect({ kind: 'smart', id: 'all' })}
          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium ${
            isActive(selection, { kind: 'smart', id: 'all' })
              ? 'bg-primary/12 text-primary'
              : 'text-foreground hover:bg-foreground/[0.05]'
          }`}
        >
          All Tasks
        </button>

        <Separator className="my-3" />

        <Text className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
          My lists
        </Text>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEndPrivate}
        >
          <SortableContext
            items={privateIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {privateLists.map((list) => (
                <SortableListRow
                  key={list.id}
                  list={list}
                  count={listIncompleteCount(list.id, tasks)}
                  selected={
                    selection.kind === 'list' && selection.id === list.id
                  }
                  onSelect={() => onSelect({ kind: 'list', id: list.id })}
                  onRename={(name) => onRenameList(list.id, name)}
                  onColor={(c) => onSetListColor(list.id, c)}
                  onRequestDelete={() => setPendingDelete(list)}
                  isShared={false}
                  partnerName={partnerName}
                  onRequestShare={() => setPendingShare(list)}
                  canUnshare={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {sharedLists.length > 0 ? (
          <>
            <Separator className="my-3" />
            <Text className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
              Shared
            </Text>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEndShared}
            >
              <SortableContext
                items={sharedIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {sharedLists.map((list) => (
                    <SortableListRow
                      key={list.id}
                      list={list}
                      count={listIncompleteCount(list.id, tasks)}
                      selected={
                        selection.kind === 'list' && selection.id === list.id
                      }
                      onSelect={() => onSelect({ kind: 'list', id: list.id })}
                      onRename={(name) => onRenameList(list.id, name)}
                      onColor={(c) => onSetListColor(list.id, c)}
                      onRequestDelete={() => setPendingDelete(list)}
                      isShared
                      partnerName={partnerName}
                      canUnshare={list.sharedOwner === activeUser}
                      onRequestUnshare={() => setPendingUnshare(list)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border/50 p-2">
        {creating ? (
          <div className="flex gap-1">
            <Input
              placeholder="List name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = newName.trim()
                  if (n) onAddList(n)
                  setNewName('')
                  setCreating(false)
                }
                if (e.key === 'Escape') {
                  setNewName('')
                  setCreating(false)
                }
              }}
              autoFocus
              className="min-w-0 flex-1"
            />
            <Button
              size="sm"
              isIconOnly
              variant="primary"
              onPress={() => {
                const n = newName.trim()
                if (n) onAddList(n)
                setNewName('')
                setCreating(false)
              }}
            >
              <Check className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 rounded-lg text-sm"
            onPress={() => setCreating(true)}
          >
            <Plus className="size-4" />
            New List
          </Button>
        )}
      </div>

      {pendingDelete ? (
        <Modal.Root state={delOverlay}>
          <Modal.Backdrop variant="opaque" className="z-[400] !bg-black/50">
            <Modal.Container className="z-[400] p-4" placement="center">
              <Modal.Dialog className="rounded-2xl border border-border bg-background p-5 shadow-xl">
                <Text className="text-base font-semibold">Delete list?</Text>
                <Text className="mt-2 text-sm text-foreground/65">
                  “{pendingDelete.name}” and all of its tasks will be removed.
                  This cannot be undone.
                </Text>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onPress={() => setPendingDelete(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onPress={() => {
                      onDeleteList(pendingDelete.id)
                      setPendingDelete(null)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      ) : null}

      {pendingShare ? (
        <Modal.Root state={shareOverlay}>
          <Modal.Backdrop variant="opaque" className="z-[400] !bg-black/50">
            <Modal.Container className="z-[400] p-4" placement="center">
              <Modal.Dialog className="rounded-2xl border border-border bg-background p-5 shadow-xl">
                <Text className="text-base font-semibold">
                  Share with {partnerName}?
                </Text>
                <Text className="mt-2 text-sm text-foreground/65">
                  “{pendingShare.name}” moves to your shared space. Both of you
                  can add, edit, complete, and remove tasks. It appears under
                  Shared for both accounts.
                </Text>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onPress={() => setPendingShare(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={() => {
                      onShareList(pendingShare.id)
                      setPendingShare(null)
                    }}
                  >
                    Share list
                  </Button>
                </div>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      ) : null}

      {pendingUnshare ? (
        <Modal.Root state={unshareOverlay}>
          <Modal.Backdrop variant="opaque" className="z-[400] !bg-black/50">
            <Modal.Container className="z-[400] p-4" placement="center">
              <Modal.Dialog className="rounded-2xl border border-border bg-background p-5 shadow-xl">
                <Text className="text-base font-semibold">Stop sharing?</Text>
                <Text className="mt-2 text-sm text-foreground/65">
                  “{pendingUnshare.name}” returns to only your lists.{' '}
                  {partnerName} will no longer see this list or its tasks.
                </Text>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onPress={() => setPendingUnshare(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={() => {
                      onUnshareList(pendingUnshare.id)
                      setPendingUnshare(null)
                    }}
                  >
                    Stop sharing
                  </Button>
                </div>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Root>
      ) : null}
    </div>
  )
}
