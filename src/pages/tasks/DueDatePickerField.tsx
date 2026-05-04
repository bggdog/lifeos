import { Button, Calendar, DatePicker, Label } from '@heroui/react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { type DateValue, parseDate } from '@internationalized/date'
import { DateInput, DateSegment, Dialog, Group } from 'react-aria-components'

type Props = {
  label?: string
  value: string | null
  onChange: (iso: string | null) => void
  allowClear?: boolean
  className?: string
}

function toCalendarDate(iso: string | null): DateValue | null {
  if (!iso) return null
  try {
    return parseDate(iso)
  } catch {
    return null
  }
}

export function DueDatePickerField({
  label,
  value,
  onChange,
  allowClear = true,
  className,
}: Props) {
  const cal = toCalendarDate(value)

  return (
    <DatePicker
      className={className}
      value={cal}
      onChange={(d) => {
        if (!d) {
          onChange(null)
          return
        }
        const y = String(d.year).padStart(4, '0')
        const m = String(d.month).padStart(2, '0')
        const day = String(d.day).padStart(2, '0')
        onChange(`${y}-${m}-${day}`)
      }}
      granularity="day"
    >
      {label ? (
        <Label className="mb-1.5 block text-sm text-foreground/70">
          {label}
        </Label>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Group className="flex min-w-0 flex-1 items-center gap-0.5 rounded-lg border border-border/60 bg-surface/40 px-2 py-1.5 outline-none focus-within:ring-2 focus-within:ring-primary/40">
          <DateInput className="flex min-w-0 bg-transparent text-sm outline-none">
            {(segment) => (
              <DateSegment
                key={`${segment.type}-${segment.text}-${segment.isPlaceholder}`}
                segment={segment}
                className="rounded px-0.5 tabular-nums text-foreground focus:bg-primary/15 data-[placeholder]:text-foreground/40"
              />
            )}
          </DateInput>
        </Group>
        <DatePicker.Trigger>
          <Button size="sm" variant="secondary" isIconOnly aria-label="Open calendar">
            <CalendarIcon className="size-4" />
          </Button>
        </DatePicker.Trigger>
        {allowClear && value ? (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-xs"
            onPress={() => onChange(null)}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <DatePicker.Popover className="max-w-[calc(100vw-2rem)]">
        <Dialog className="p-0 outline-none">
          <Calendar />
        </Dialog>
      </DatePicker.Popover>
    </DatePicker>
  )
}
