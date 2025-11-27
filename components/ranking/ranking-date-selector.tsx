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
  formatDateShort,
  getLast7Days,
  formatDate,
} from "@/lib/ranking-helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring border-2 border-lime-400/50 bg-transparent text-lime-400 hover:shadow-[0_4px_15px_rgba(204,255,0,0.2)] h-11 px-6 py-2.5 w-full sm:w-auto text-left"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateForDisplay(selectedDate)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-1.5">
            <div className="space-y-1.5 w-full">
              <h3 className="text-xs font-medium text-foreground px-1">
                Últimos 7 días
              </h3>

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
                        "w-full text-left p-2 rounded-md transition-all duration-200 border text-xs",
                        isSelectedDay
                          ? "bg-primary text-primary-foreground shadow-sm border-primary"
                          : "bg-background border border-muted-foreground/20 text-foreground hover:bg-accent/20 hover:border-accent/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {formatDateShort(date)}
                          </div>
                          <div className="text-xs sm:text-base opacity-70">
                            {format(date, "PPP", { locale: es })}
                          </div>
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
          <span>Ranking del {formatDate(rankingDate)}</span>
        </div>
      )}
    </div>
  );
};
