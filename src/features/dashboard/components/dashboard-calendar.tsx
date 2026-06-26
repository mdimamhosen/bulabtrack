import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tag,
  Sparkles,
  FileText,
  X,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PlannerEvent {
  id: string;
  title: string;
  time: string;
  description: string;
  date: string; // YYYY-MM-DD
  category: "maintenance" | "audit" | "procurement" | "general";
}

const CATEGORY_STYLES = {
  maintenance: {
    color: "var(--color-warning)",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.3)",
    label: "Maintenance",
  },
  audit: {
    color: "var(--color-chart-3)",
    bg: "rgba(168, 85, 247, 0.15)",
    border: "rgba(168, 85, 247, 0.3)",
    label: "Audit",
  },
  procurement: {
    color: "var(--color-accent)",
    bg: "rgba(6, 182, 212, 0.15)",
    border: "rgba(6, 182, 212, 0.3)",
    label: "Procurement",
  },
  general: {
    color: "var(--color-primary)",
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.3)",
    label: "General",
  },
};

export function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PlannerEvent["category"]>("general");

  // Load events from LocalStorage or initialize with mock data
  useEffect(() => {
    const stored = localStorage.getItem("labtrack_planner_events");
    if (stored) {
      setEvents(JSON.parse(stored));
    } else {
      // Setup mock events for the current month
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, "0");
      
      const mockEvents: PlannerEvent[] = [
        {
          id: "mock-1",
          title: "Clean server rack fans",
          time: "09:00 AM",
          description: "Routine dust blowing on Main Server Cabinet 01 & 02.",
          date: `${yr}-${mo}-05`,
          category: "maintenance",
        },
        {
          id: "mock-2",
          title: "Verify mechanical keyboards",
          time: "02:00 PM",
          description: "Acoustic check and stabilizer lubing on Bin A.",
          date: `${yr}-${mo}-12`,
          category: "maintenance",
        },
        {
          id: "mock-3",
          title: "Audit peripheral stock serials",
          time: "10:30 AM",
          description: "Scan barcode matches for newly arrived Dell displays.",
          date: `${yr}-${mo}-19`,
          category: "audit",
        },
        {
          id: "mock-4",
          title: "Procurement requisition review",
          time: "11:00 AM",
          description: "Finalize COD order details for SteelSeries keyboard bundles.",
          date: `${yr}-${mo}-25`,
          category: "procurement",
        },
        {
          id: "mock-5",
          title: "General system status scan",
          time: "04:00 PM",
          description: "Verify Edge runtime sync and telemetry log connections.",
          date: `${yr}-${mo}-28`,
          category: "general",
        },
      ];
      setEvents(mockEvents);
      localStorage.setItem("labtrack_planner_events", JSON.stringify(mockEvents));
    }
  }, []);

  // Save events to LocalStorage helper
  const saveEvents = (newEvents: PlannerEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem("labtrack_planner_events", JSON.stringify(newEvents));
  };

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  const startDayOfWeek = getDay(monthStart); // 0 (Sun) to 6 (Sat)

  // Empty spaces before first day of month
  const emptyDays = Array.from({ length: startDayOfWeek });

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Get events for specific date
  const getEventsForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return events.filter((e) => e.date === dateString);
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const allUpcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date(format(new Date(), "yyyy-MM-dd")))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  // Add event handler
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an event title.");
      return;
    }

    const newEvent: PlannerEvent = {
      id: `evt-${Date.now()}`,
      title,
      time: time || "All day",
      description,
      date: format(selectedDate, "yyyy-MM-dd"),
      category,
    };

    const updated = [...events, newEvent];
    saveEvents(updated);
    toast.success(`Event added for ${format(selectedDate, "MMMM d")}`);
    
    // Reset form
    setTitle("");
    setTime("");
    setDescription("");
    setCategory("general");
    setShowAddForm(false);
  };

  // Delete event handler
  const handleDeleteEvent = (id: string) => {
    const filtered = events.filter((e) => e.id !== id);
    saveEvents(filtered);
    toast.success("Event removed successfully");
  };

  return (
    <div className="liquid-card rounded-3xl border border-border/55 p-6 md:p-8 bg-gradient-to-br from-card via-card to-primary/5">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: The Calendar Month Grid */}
        <div className="flex-grow flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-lg">Warehouse Planner</h3>
                <p className="text-xs text-muted-foreground">Schedule peripheral audits & tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border hover:bg-card/40 cursor-pointer"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-bold text-foreground min-w-[100px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border hover:bg-card/40 cursor-pointer"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted-foreground mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty days */}
            {emptyDays.map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}

            {/* Days in Month */}
            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayEvents = getEventsForDate(day);
              
              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day);
                    setShowAddForm(false);
                  }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer text-xs font-bold border ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground shadow-glow scale-[1.03]"
                      : isToday
                        ? "bg-primary/10 border-primary/50 text-primary hover:bg-primary/20"
                        : "bg-zinc-950/20 border-border/40 text-foreground hover:border-primary/30 hover:bg-card/30"
                  }`}
                >
                  <span>{format(day, "d")}</span>
                  
                  {/* Event indicators dots */}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1.5 flex gap-1 justify-center w-full">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const style = CATEGORY_STYLES[evt.category];
                        return (
                          <span
                            key={evt.id}
                            className="h-1 w-1 rounded-full animate-pulse"
                            style={{ backgroundColor: isSelected ? "#fff" : style.color }}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upcoming Events Mini Widget */}
          <div className="mt-8 pt-6 border-t border-border/20">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
              Upcoming Scheduler Deadlines
            </h4>
            <div className="space-y-2">
              {allUpcomingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">No upcoming scheduled items.</p>
              ) : (
                allUpcomingEvents.map((evt) => {
                  const style = CATEGORY_STYLES[evt.category];
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedDate(parseISO(evt.date));
                        setShowAddForm(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-zinc-950/10 hover:border-primary/20 transition-all cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: style.color }}
                        />
                        <span className="font-bold text-foreground truncate max-w-[180px] sm:max-w-[280px]">
                          {evt.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {format(parseISO(evt.date), "MMM d")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Notes & Events Detail list & form */}
        <div className="lg:w-[350px] shrink-0 border-t lg:border-t-0 lg:border-l border-border/20 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-foreground text-sm">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Notes & event logs
                </p>
              </div>

              {!showAddForm && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-7 px-2.5 text-[10px] font-bold border-border/80 text-foreground flex items-center gap-1 cursor-pointer hover:bg-card/40"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-3 w-3" /> Add Event
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {showAddForm ? (
                /* ADD EVENT FORM */
                <motion.form
                  key="add-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleAddEvent}
                  className="space-y-4 bg-zinc-950/20 border border-border/40 p-4 rounded-2xl"
                >
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <span className="text-[11px] font-extrabold text-primary flex items-center gap-1">
                      <PlusCircle className="h-3.5 w-3.5" /> Create Scheduler Event
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">
                      Title
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Lubing switches"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 h-8 rounded-lg text-xs bg-zinc-950/40 border-border/70 text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">
                        Time
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. 10:00 AM"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="mt-1 h-8 rounded-lg text-xs bg-zinc-950/40 border-border/70 text-foreground"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="mt-1 h-8 w-full rounded-lg text-xs bg-zinc-900 border border-border/70 text-foreground px-2 focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="general" className="bg-zinc-900 text-foreground">General</option>
                        <option value="maintenance" className="bg-zinc-900 text-foreground">Maintenance</option>
                        <option value="audit" className="bg-zinc-900 text-foreground">Audit</option>
                        <option value="procurement" className="bg-zinc-900 text-foreground">Procurement</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">
                      Details / Notes
                    </label>
                    <Textarea
                      placeholder="Enter description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 min-h-[60px] rounded-lg text-xs bg-zinc-950/40 border-border/70 text-foreground"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold h-8.5 text-xs shadow-glow cursor-pointer"
                  >
                    Save Event
                  </Button>
                </motion.form>
              ) : (
                /* EVENTS LIST FOR SELECTED DATE */
                <motion.div
                  key="events-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 min-h-[220px]"
                >
                  {selectedDateEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-border/40 rounded-2xl bg-zinc-950/5">
                      <FileText className="h-6 w-6 text-muted-foreground/60 mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">No events logged.</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[180px]">
                        Click Add Event above to schedule items for this day.
                      </p>
                    </div>
                  ) : (
                    selectedDateEvents.map((evt) => {
                      const style = CATEGORY_STYLES[evt.category];
                      return (
                        <div
                          key={evt.id}
                          className="p-3.5 rounded-xl border relative group transition-all duration-300 hover:shadow-md bg-zinc-950/10"
                          style={{ borderColor: style.border }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 rounded-md border"
                              style={{
                                color: style.color,
                                backgroundColor: style.bg,
                                borderColor: style.border,
                              }}
                            >
                              {style.label}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-0.5"
                              title="Delete Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <h5 className="font-extrabold text-foreground text-xs mt-2">{evt.title}</h5>
                          
                          {evt.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                              {evt.description}
                            </p>
                          )}

                          <div className="flex items-center gap-1 mt-2.5 text-[9px] text-muted-foreground font-mono">
                            <Clock className="h-3 w-3 text-primary" /> {evt.time}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border/10 text-[10px] text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>Updates saved to local storage</span>
          </div>
        </div>

      </div>
    </div>
  );
}
