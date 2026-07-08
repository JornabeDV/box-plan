import { useState } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatDateForDisplay,
  getLast7Days,
  formatDate,
} from "@/lib/ranking-helpers";

interface RankingDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  rankingDate?: string;
}

export const RankingDateSelector = ({
  selectedDate,
  onDateChange,
  rankingDate,
}: RankingDateSelectorProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const last7Days = getLast7Days();

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    onDateChange(date);
    setCalendarOpen(false);
  };

  return (
    <div className="space-y-4">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            id="ranking-date"
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-base font-semibold transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring border border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 h-11 px-6 py-2.5 w-full sm:w-auto text-left"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateForDisplay(selectedDate)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none" align="center">
          <div className="p-1.5">
            <div className="space-y-1.5 w-full">
              <div className="grid grid-cols-1 gap-1">
                {last7Days.map((date) => {
                  const isSelectedDay = isSelected(date);
                  const dateStr = date.toDateString();

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "w-full text-left p-2 rounded-none transition-all duration-200 border text-base",
                        isSelectedDay
                          ? "bg-primary text-primary-foreground shadow-sm border-primary"
                          : "bg-background border border-muted-foreground/20 text-foreground hover:bg-accent/20 hover:border-accent/30"
                      )}
                    >
                      <div className="flex items-center justify-center">
                        <div className="font-medium">
                          {formatDateForDisplay(date)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {rankingDate && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm sm:text-base">Ranking del {formatDate(rankingDate)}</span>
        </div>
      )}
    </div>
  );
};
