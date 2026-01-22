import { Calendar, Clock, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Appointment {
  id: string;
  datum: string;
  uhrzeit: string;
  verfuegbar: boolean;
}

interface AdvisorInfo {
  name: string;
  title: string;
  avatarUrl: string;
}

interface AppointmentBookingProps {
  appointments: Appointment[];
  advisor: AdvisorInfo;
  isOpen: boolean;
  onSelect: (appointment: Appointment) => void;
  onCancel: () => void;
}

export function AppointmentBooking({
  appointments,
  advisor,
  isOpen,
  onSelect,
  onCancel,
}: AppointmentBookingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isOpen || !appointments || appointments.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${dayName}, ${day}. ${month}`;
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    if (!appointment.verfuegbar) return;
    setSelectedId(appointment.id);
    // Small delay for visual feedback
    setTimeout(() => {
      onSelect(appointment);
      setSelectedId(null);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl max-w-2xl w-full h-[80vh] flex flex-col p-6 animate-scale-in">
        {/* Header with Advisor Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
          <div className="relative">
            <img
              src={advisor.avatarUrl}
              alt={advisor.name}
              className="w-16 h-16 rounded-full object-cover bg-primary/10 ring-2 ring-primary/20"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-xl font-bold text-primary">
                {advisor.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{advisor.name}</h2>
            <p className="text-sm text-muted-foreground">{advisor.title}</p>
          </div>
          <Calendar className="w-6 h-6 text-primary" />
        </div>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Verfügbare Termine</h3>
          <p className="text-sm text-muted-foreground">
            Wählen Sie einen passenden Termin aus
          </p>
        </div>

        {/* Scrollable Appointments List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
          {appointments.map((appointment) => {
            const isSelected = selectedId === appointment.id;
            
            return (
              <button
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment)}
                disabled={!appointment.verfuegbar}
                className={cn(
                  "w-full glass-card rounded-xl p-4 transition-all",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "border-2",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : appointment.verfuegbar
                    ? "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    : "border-border/30 opacity-50 cursor-not-allowed",
                  "disabled:hover:scale-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-primary/20" : "bg-primary/5"
                    )}>
                      <Clock className={cn(
                        "w-6 h-6",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">
                        {formatDate(appointment.datum)}
                      </div>
                      <div className={cn(
                        "text-sm flex items-center gap-1.5",
                        isSelected ? "text-primary font-medium" : "text-muted-foreground"
                      )}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{appointment.uhrzeit} Uhr</span>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <CheckCircle2 className="w-6 h-6 text-primary animate-scale-in" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
