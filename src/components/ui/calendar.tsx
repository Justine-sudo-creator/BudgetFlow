"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  setYear,
  setMonth
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}

export function Calendar({
  selected,
  onSelect,
  className,
}: CalendarProps) {
  // Use a ref to track the initial view date to avoid resets
  const [viewDate, setViewDate] = React.useState(selected || new Date())

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setViewDate(subMonths(viewDate, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setViewDate(addMonths(viewDate, 1))
  }

  const handleYearChange = (year: string) => {
    setViewDate(setYear(viewDate, parseInt(year)))
  }

  const handleMonthChange = (month: string) => {
    setViewDate(setMonth(viewDate, parseInt(month)))
  }

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const results = []
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      results.push(i)
    }
    return results
  }, [])

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div 
      className={cn("p-3 w-[280px] bg-popover rounded-md border shadow-md", className)}
      onClick={(e) => e.stopPropagation()} // Prevent closing popovers when clicking inside calendar
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <Button 
          type="button"
          variant="outline" 
          size="icon" 
          onClick={handlePrevMonth} 
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1 flex-1">
           <Select value={viewDate.getMonth().toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 flex-1 text-xs px-2">
              <SelectValue>{months[viewDate.getMonth()]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={viewDate.getFullYear().toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[75px] text-xs px-2">
              <SelectValue>{viewDate.getFullYear()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {years.reverse().map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          type="button"
          variant="outline" 
          size="icon" 
          onClick={handleNextMonth} 
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-[0.7rem] font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isSelected = selected && isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, viewDate)
          const isTodayDate = isToday(day)

          return (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 font-normal text-xs transition-none",
                !isCurrentMonth && "text-muted-foreground opacity-30",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                isTodayDate && !isSelected && "bg-accent text-accent-foreground border border-primary/20"
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelect?.(day)
              }}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
