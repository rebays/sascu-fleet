"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Parse/format using local calendar dates (not UTC) so "2026-07-15" always
// means the 15th, regardless of the browser's timezone offset.
function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

interface DatePickerProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  disabled,
  error,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = parseDateValue(value);
  const minDate = min ? startOfDay(parseDateValue(min)!) : undefined;
  const maxDate = max ? startOfDay(parseDateValue(max)!) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          data-error={!!error}
          className={cn(
            "h-auto w-full justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-left ring-offset-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[error=true]:border-destructive data-[error=true]:focus-visible:ring-destructive/40",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          {selected
            ? selected.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate}
          onSelect={(date) => {
            if (date) {
              onChange(toDateValue(date));
              setOpen(false);
            }
          }}
          disabled={(date) => {
            const day = startOfDay(date);
            if (minDate && day < minDate) return true;
            if (maxDate && day > maxDate) return true;
            return false;
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
