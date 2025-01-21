import { format } from "date-fns"
import { CalendarIcon, XCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DatePicker(props: DatePickerProps) {
  const { date, setDate } = props;

  const clearDate = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.stopPropagation();
    setDate(undefined);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="bg-[#F8F9FA] border h-100 flex items-center px-2">
        <XCircleIcon 
          style={{ height: '18px' }} 
          className={cn({
            "cursor-pointer": date,
            "cursor-not-allowed text-muted-foreground": !date,
          })}
          onClick={clearDate} 
        />
      </div>

    </>
  )
}
