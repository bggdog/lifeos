/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- sync fields; deps avoid store snapshot churn */
import {
  Button,
  Chip,
  ChipLabel,
  Input,
  Label,
  ListBox,
  Select,
  Text,
  TextArea,
  TextField,
  toast,
} from '@heroui/react'
import { Download, File, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmModal } from '../components/ConfirmModal'
import { priorityChipClass, statusChipClass } from '../statusStyles'
import { withStatusChange } from '../ticketMutations'
import { useWarranty } from '../WarrantyContext'
import type { Appointment, CommunicationEntry, Ticket } from '../types'
import { daysBetween, newId, nowIso, sortStatusConfig, timeSlots30, todayLocalISO } from '../utils'
import { COMM_TYPES, TICKET_CATEGORIES } from '../constants'

export default function WarrantyTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const {
    tickets,
    homes,
    communities,
    contractors,
    statusConfig,
    upsertTicket,
    deleteTicket,
  } = useWarranty()

  const ticket = useMemo(
    () => tickets.find((t) => t.id === ticketId),
    [tickets, ticketId],
  )
  const home = useMemo(
    () => homes.find((h) => h.id === ticket?.homeId),
    [homes, ticket],
  )
  const community = useMemo(
    () => communities.find((c) => c.id === ticket?.communityId),
    [communities, ticket],
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quickNote, setQuickNote] = useState('')
  const [delTicket, setDelTicket] = useState(false)
  const [delCommId, setDelCommId] = useState<string | null>(null)
  const [delApptId, setDelApptId] = useState<string | null>(null)
  const [delAttachId, setDelAttachId] = useState<string | null>(null)

  const [apptForm, setApptForm] = useState({
    date: todayLocalISO(),
    time: timeSlots30()[0] ?? '9:00 AM',
    notes: '',
    confirmed: false,
  })
  const [commForm, setCommForm] = useState<{ type: CommunicationEntry['type']; content: string }>(
    { type: 'note', content: '' },
  )

  useEffect(() => {
    if (!ticket) return
    setTitle(ticket.title)
    setDescription(ticket.description)
  }, [ticket?.id, ticket?.title, ticket?.description])

  const persist = useCallback(
    (next: Ticket) => {
      upsertTicket({ ...next, updatedAt: nowIso() })
    },
    [upsertTicket],
  )

  if (!ticketId || !ticket) {
    return (
      <div className="p-6">
        <Text className="text-sm text-foreground/60">Ticket not found.</Text>
        <Button variant="ghost" className="mt-2" onPress={() => navigate('/warranty/tickets')}>
          Back to tickets
        </Button>
      </div>
    )
  }

  const today = todayLocalISO()
  const daysSinceClose =
    home?.closingDate != null ? daysBetween(home.closingDate, today) : null

  const saveTitle = () => {
    const t = title.trim()
    if (!t || t === ticket.title) return
    persist({ ...ticket, title: t })
  }

  const saveDescription = () => {
    if (description === ticket.description) return
    persist({ ...ticket, description })
  }

  const patchField = <K extends keyof Ticket>(key: K, value: Ticket[K]) => {
    if (ticket[key] === value) return
    persist({ ...ticket, [key]: value })
  }

  const changeStatus = (to: string) => {
    if (to === ticket.status) return
    persist(withStatusChange(ticket, to, 'Status updated', statusConfig))
  }

  const addAppointment = () => {
    const ap: Appointment = {
      id: newId(),
      date: apptForm.date,
      time: apptForm.time,
      notes: apptForm.notes.trim(),
      confirmed: apptForm.confirmed,
    }
    persist({
      ...ticket,
      appointments: [...ticket.appointments, ap],
    })
    setApptForm({
      date: todayLocalISO(),
      time: timeSlots30()[0] ?? '9:00 AM',
      notes: '',
      confirmed: false,
    })
  }

  const addCommunication = () => {
    const content = commForm.content.trim()
    if (!content) return
    const entry: CommunicationEntry = {
      id: newId(),
      type: commForm.type,
      content,
      createdAt: nowIso(),
    }
    persist({
      ...ticket,
      communications: [...ticket.communications, entry],
    })
    setCommForm({ type: 'note', content: '' })
  }

  const saveQuickNote = () => {
    const content = quickNote.trim()
    if (!content) return
    const entry: CommunicationEntry = {
      id: newId(),
      type: 'note',
      content,
      createdAt: nowIso(),
    }
    persist({
      ...ticket,
      communications: [...ticket.communications, entry],
    })
    setQuickNote('')
    toast.success('Note saved', { timeout: 2000 })
  }

  const onUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.success('Large file: base64 storage works best under 2 MB.', { timeout: 4000 })
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      persist({
        ...ticket,
        attachments: [
          ...ticket.attachments,
          {
            id: newId(),
            name: file.name,
            dataUrl,
            type: file.type || 'application/octet-stream',
            uploadedAt: nowIso(),
          },
        ],
      })
    }
    reader.readAsDataURL(file)
  }

  const statusItem = statusConfig.find((s) => s.id === ticket.status)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-24 md:flex-row md:gap-6 md:p-6 md:pb-6">
      <div className="min-h-0 min-w-0 flex-1 space-y-6">
        <header className="space-y-3 border-b border-border/60 pb-4">
          <TextField name="title">
            <Label className="sr-only">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              className="text-lg font-semibold md:text-xl"
            />
          </TextField>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge statusId={ticket.status} statusConfig={statusConfig} />
            <Chip
              size="sm"
              variant="secondary"
              className={`border font-medium capitalize ${priorityChipClass(ticket.priority)}`}
            >
              <ChipLabel>{ticket.priority}</ChipLabel>
            </Chip>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusChipClass(statusItem)}`}
            >
              {ticket.category}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-foreground/50">
            <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
            <span>·</span>
            <span>Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
          </div>
          <div className="text-sm">
            {home ? (
              <Link
                to={`/warranty/homes/${home.id}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {home.address}
              </Link>
            ) : null}
            {community ? (
              <span className="text-foreground/55">
                {' '}
                ·{' '}
                <Link
                  to={`/warranty/communities/${community.id}`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {community.name}
                </Link>
              </span>
            ) : null}
          </div>
        </header>

        <section className="space-y-2">
          <Text className="text-sm font-semibold text-foreground">Description</Text>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescription}
            rows={6}
            className="min-h-[140px] w-full resize-y rounded-xl border border-border/60 bg-surface/40 text-sm"
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Text className="text-sm font-semibold text-foreground">Appointments</Text>
          </div>
          <ul className="space-y-2">
            {ticket.appointments.map((a) => (
              <li
                key={a.id}
                className="group flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-surface/30 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {a.date} · {a.time}
                  </p>
                  <p className="text-xs text-foreground/60">{a.notes || '—'}</p>
                  {a.confirmed ? (
                    <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200">
                      Confirmed
                    </span>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onPress={() => setDelApptId(a.id)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-border/60 bg-surface/20 p-3 space-y-2">
            <Text className="text-xs font-semibold uppercase text-foreground/50">
              Schedule appointment
            </Text>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextField name="ad">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={apptForm.date}
                  onChange={(e) => setApptForm((f) => ({ ...f, date: e.target.value }))}
                />
              </TextField>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Select.Root
                  selectedKey={apptForm.time}
                  onSelectionChange={(key) =>
                    setApptForm((f) => ({ ...f, time: String(key) }))
                  }
                >
                  {() => (
                    <>
                      <Select.Trigger className="w-full">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="max-h-60 w-[var(--trigger-width)]">
                        <ListBox.Root selectionMode="single" className="max-h-56 overflow-y-auto py-1">
                          {timeSlots30().map((t) => (
                            <ListBox.Item key={t} id={t} textValue={t}>
                              {t}
                            </ListBox.Item>
                          ))}
                        </ListBox.Root>
                      </Select.Popover>
                    </>
                  )}
                </Select.Root>
              </div>
            </div>
            <TextField name="an">
              <Label className="text-xs">Notes</Label>
              <Input
                value={apptForm.notes}
                onChange={(e) => setApptForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </TextField>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground/75">
              <input
                type="checkbox"
                checked={apptForm.confirmed}
                onChange={(e) =>
                  setApptForm((f) => ({ ...f, confirmed: e.target.checked }))
                }
              />
              Confirmed
            </label>
            <Button variant="secondary" size="sm" className="rounded-full" onPress={addAppointment}>
              Add appointment
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <Text className="text-sm font-semibold text-foreground">Communications</Text>
          <ul className="space-y-2">
            {[...ticket.communications]
              .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
              .map((c) => (
                <li
                  key={c.id}
                  className="group flex gap-2 rounded-lg border border-border/50 bg-surface/30 px-3 py-2 text-sm"
                >
                  <span className="shrink-0 text-lg" title={c.type}>
                    {c.type === 'email'
                      ? '✉️'
                      : c.type === 'call'
                        ? '📞'
                        : c.type === 'text'
                          ? '💬'
                          : '📝'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-foreground/85">{c.content}</p>
                    <p className="mt-1 text-[11px] text-foreground/45">
                      {c.type} · {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                    onPress={() => setDelCommId(c.id)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </li>
              ))}
          </ul>
          <div className="rounded-xl border border-border/60 bg-surface/20 p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label className="text-xs">Type</Label>
                <Select.Root
                  selectedKey={commForm.type}
                  onSelectionChange={(key) =>
                    setCommForm((f) => ({
                      ...f,
                      type: String(key) as CommunicationEntry['type'],
                    }))
                  }
                >
                  {() => (
                    <>
                      <Select.Trigger className="w-full">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="w-[var(--trigger-width)]">
                        <ListBox.Root selectionMode="single" className="py-1">
                          {COMM_TYPES.map((t) => (
                            <ListBox.Item key={t} id={t} textValue={t}>
                              {t}
                            </ListBox.Item>
                          ))}
                        </ListBox.Root>
                      </Select.Popover>
                    </>
                  )}
                </Select.Root>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Content</Label>
                <TextArea
                  value={commForm.content}
                  onChange={(e) =>
                    setCommForm((f) => ({ ...f, content: e.target.value }))
                  }
                  rows={3}
                  className="min-h-[72px] w-full resize-y text-sm"
                />
              </div>
            </div>
            <Button variant="secondary" size="sm" className="rounded-full" onPress={addCommunication}>
              Log communication
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">Attachments</Text>
            <label className="cursor-pointer">
              <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                + Upload
              </span>
              <input
                type="file"
                className="sr-only"
                onChange={(e) => onUpload(e.target.files)}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ticket.attachments.map((a) => (
              <div
                key={a.id}
                className="group relative overflow-hidden rounded-lg border border-border/60 bg-surface/40 p-2"
              >
                {a.type.startsWith('image/') ? (
                  <img
                    src={a.dataUrl}
                    alt=""
                    className="mb-2 aspect-video w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="mb-2 flex aspect-video items-center justify-center rounded-md bg-foreground/5">
                    <File className="size-8 text-foreground/35" />
                  </div>
                )}
                <p className="line-clamp-2 text-[11px] font-medium text-foreground">{a.name}</p>
                <p className="text-[10px] text-foreground/45">
                  {new Date(a.uploadedAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label="Download"
                    onPress={() => {
                      const aEl = document.createElement('a')
                      aEl.href = a.dataUrl
                      aEl.download = a.name
                      aEl.click()
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label="Delete"
                    onPress={() => setDelAttachId(a.id)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Button variant="ghost" className="text-danger" onPress={() => setDelTicket(true)}>
          Delete ticket
        </Button>
      </div>

      <aside className="w-full shrink-0 space-y-4 border-t border-border/60 pt-4 md:w-[300px] md:border-l md:border-t-0 md:pl-6 md:pt-0 md:sticky md:top-4 md:self-start">
        <CardSection title="Details">
          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-foreground/55">Contractor</Label>
              <Select.Root
                selectedKey={ticket.assignedContractorId ?? 'none'}
                onSelectionChange={(key) =>
                  patchField(
                    'assignedContractorId',
                    key === 'none' ? null : String(key),
                  )
                }
              >
                {() => (
                  <>
                    <Select.Trigger className="mt-1 w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="w-[var(--trigger-width)]">
                      <ListBox.Root selectionMode="single" className="max-h-52 overflow-y-auto py-1">
                        <ListBox.Item id="none" textValue="None">
                          None
                        </ListBox.Item>
                        {contractors.map((c) => (
                          <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                            {c.name}
                          </ListBox.Item>
                        ))}
                      </ListBox.Root>
                    </Select.Popover>
                  </>
                )}
              </Select.Root>
              {ticket.assignedContractorId ? (
                <div className="mt-2 text-xs text-foreground/60">
                  {(() => {
                    const c = contractors.find((x) => x.id === ticket.assignedContractorId)
                    return c ? (
                      <>
                        <p>{c.trade}</p>
                        <p>{c.phone}</p>
                      </>
                    ) : null
                  })()}
                </div>
              ) : null}
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Status</Label>
              <Select.Root
                selectedKey={ticket.status}
                onSelectionChange={(key) => changeStatus(String(key))}
              >
                {() => (
                  <>
                    <Select.Trigger className="mt-1 w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="w-[var(--trigger-width)]">
                      <ListBox.Root selectionMode="single" className="max-h-56 overflow-y-auto py-1">
                        {sortStatusConfig(statusConfig).map((s) => (
                          <ListBox.Item key={s.id} id={s.id} textValue={s.label}>
                            {s.label}
                          </ListBox.Item>
                        ))}
                      </ListBox.Root>
                    </Select.Popover>
                  </>
                )}
              </Select.Root>
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Priority</Label>
              <Select.Root
                selectedKey={ticket.priority}
                onSelectionChange={(key) =>
                  patchField('priority', String(key) as Ticket['priority'])
                }
              >
                {() => (
                  <>
                    <Select.Trigger className="mt-1 w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="w-[var(--trigger-width)]">
                      <ListBox.Root selectionMode="single" className="py-1">
                        {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                          <ListBox.Item key={p} id={p} textValue={p}>
                            {p}
                          </ListBox.Item>
                        ))}
                      </ListBox.Root>
                    </Select.Popover>
                  </>
                )}
              </Select.Root>
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Category</Label>
              <Select.Root
                selectedKey={ticket.category}
                onSelectionChange={(key) => patchField('category', String(key))}
              >
                {() => (
                  <>
                    <Select.Trigger className="mt-1 w-full">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover className="w-[var(--trigger-width)]">
                      <ListBox.Root selectionMode="single" className="max-h-56 overflow-y-auto py-1">
                        {TICKET_CATEGORIES.map((c) => (
                          <ListBox.Item key={c} id={c} textValue={c}>
                            {c}
                          </ListBox.Item>
                        ))}
                      </ListBox.Root>
                    </Select.Popover>
                  </>
                )}
              </Select.Root>
            </div>
          </div>
        </CardSection>

        <CardSection title="Home">
          {home ? (
            <div className="space-y-1 text-sm text-foreground/75">
              <p className="font-medium text-foreground">{home.address}</p>
              <p>Lot {home.lotNumber || '—'}</p>
              <p>{community?.name ?? '—'}</p>
              <p className="pt-2 font-medium text-foreground">{home.homeowner.name || '—'}</p>
              <a href={`mailto:${home.homeowner.email}`} className="text-primary hover:underline">
                {home.homeowner.email || '—'}
              </a>
              <p>
                <a href={`tel:${home.homeowner.phone}`} className="text-primary hover:underline">
                  {home.homeowner.phone || '—'}
                </a>
              </p>
              {daysSinceClose !== null ? (
                <p className="pt-2 text-xs text-foreground/50">{daysSinceClose} days since closing</p>
              ) : null}
            </div>
          ) : (
            <Text className="text-sm text-foreground/55">Home not linked.</Text>
          )}
        </CardSection>

        <CardSection title="Status history">
          <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
            {[...ticket.statusHistory]
              .sort((a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt))
              .map((h) => (
                <li key={h.id} className="rounded-md border border-border/40 bg-background/80 px-2 py-1.5">
                  <p className="font-medium text-foreground">
                    {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                  </p>
                  {h.note ? <p className="text-foreground/60">{h.note}</p> : null}
                  <p className="text-[10px] text-foreground/45">
                    {new Date(h.changedAt).toLocaleString()}
                  </p>
                </li>
              ))}
          </ul>
        </CardSection>

        <CardSection title="Quick note">
          <TextArea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            rows={4}
            className="w-full resize-y text-sm"
            placeholder="Add an internal note…"
          />
          <Button variant="primary" size="sm" className="mt-2 w-full rounded-full" onPress={saveQuickNote}>
            Save note
          </Button>
        </CardSection>
      </aside>

      <ConfirmModal
        open={delTicket}
        title="Delete ticket?"
        body="This permanently removes the ticket and its history."
        onOpenChange={setDelTicket}
        onConfirm={() => {
          deleteTicket(ticket.id)
          navigate('/warranty/tickets')
        }}
      />
      <ConfirmModal
        open={delCommId !== null}
        title="Remove log entry?"
        body="This communication entry will be removed."
        danger
        confirmLabel="Remove"
        onOpenChange={(v) => {
          if (!v) setDelCommId(null)
        }}
        onConfirm={() => {
          if (!delCommId) return
          persist({
            ...ticket,
            communications: ticket.communications.filter((c) => c.id !== delCommId),
          })
          setDelCommId(null)
        }}
      />
      <ConfirmModal
        open={delApptId !== null}
        title="Delete appointment?"
        body="Remove this scheduled appointment from the ticket."
        onOpenChange={(v) => {
          if (!v) setDelApptId(null)
        }}
        onConfirm={() => {
          if (!delApptId) return
          persist({
            ...ticket,
            appointments: ticket.appointments.filter((a) => a.id !== delApptId),
          })
          setDelApptId(null)
        }}
      />
      <ConfirmModal
        open={delAttachId !== null}
        title="Delete attachment?"
        body="Remove this file from the ticket."
        onOpenChange={(v) => {
          if (!v) setDelAttachId(null)
        }}
        onConfirm={() => {
          if (!delAttachId) return
          persist({
            ...ticket,
            attachments: ticket.attachments.filter((a) => a.id !== delAttachId),
          })
          setDelAttachId(null)
        }}
      />
    </div>
  )
}

function CardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-3">
      <Text className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
        {title}
      </Text>
      <div className="mt-2">{children}</div>
    </div>
  )
}
