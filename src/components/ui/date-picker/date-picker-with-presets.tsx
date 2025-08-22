"use client"

import * as React from "react"
import { format, addDays, startOfWeek, startOfMonth } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/date-picker/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithPresetsProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const presets = [
  {
    label: "Today",
    value: new Date(),
  },
  {
    label: "Tomorrow",
    value: addDays(new Date(), 1),
  },
  {
    label: "This Week",
    value: startOfWeek(new Date(), { weekStartsOn: 1 }),
  },
  {
    label: "Next Week",
    value: startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
  },
  {
    label: "This Month",
    value: startOfMonth(new Date()),
  },
  {
    label: "Next Month",
    value: startOfMonth(addDays(new Date(), 30)),
  },
]

export function DatePickerWithPresets({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerWithPresetsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => onDateChange?.(preset.value)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
