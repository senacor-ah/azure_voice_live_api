'use client';

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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
    setSelectedAppointment(appointment);
  };

  const handleConfirm = () => {
    if (!selectedAppointment) return;
    onSelect(selectedAppointment);
    setSelectedAppointment(null);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{background: 'rgba(0,0,0,0.35)'}}>
      <div className="rounded-2xl max-w-2xl w-full flex flex-col p-6 animate-scale-in" style={{background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', height: '80vh'}}>
        {/* Header with Advisor Info */}
        <div className="flex items-center gap-4 mb-6 pb-6" style={{borderBottom: '1px solid #e2e8f0'}}>
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
          <p className="text-sm" style={{color: '#64748b'}}>Wählen Sie einen passenden Termin aus</p>
        </div>

        {/* Scrollable Appointments List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
          {appointments.map((appointment) => {
            const isSelected = selectedAppointment?.id === appointment.id;
            
            return (
              <button
                key={appointment.id}
                onClick={() => handleAppointmentClick(appointment)}
                disabled={!appointment.verfuegbar}
                className={cn(
                  "w-full rounded-xl p-4 transition-all text-left",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "border-2",
                  isSelected
                    ? "border-[#7da0d7]"
                    : appointment.verfuegbar
                    ? "border-[#e2e8f0] hover:border-[#7da0d7]"
                    : "border-[#e2e8f0] opacity-50 cursor-not-allowed",
                  "disabled:hover:scale-100"
                )}
                style={isSelected ? {background: 'rgba(125,160,215,0.1)', boxShadow: '0 4px 16px rgba(125,160,215,0.2)'} : {background: '#fff'}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background: isSelected ? 'rgba(125,160,215,0.2)' : '#eef3fb'}}>
                      <Clock className="w-6 h-6" style={{color: isSelected ? '#7da0d7' : '#64748b'}} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">{formatDate(appointment.datum)}</div>
                      <div className="text-sm flex items-center gap-1.5" style={{color: isSelected ? '#7da0d7' : '#64748b', fontWeight: isSelected ? 500 : 400}}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{appointment.uhrzeit} Uhr</span>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <CheckCircle2 className="w-6 h-6 animate-scale-in" style={{color: '#7da0d7'}} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 flex gap-3" style={{borderTop: '1px solid #e2e8f0'}}>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
            style={{border: '1px solid #e2e8f0', background: '#f8faff'}}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAppointment}
            className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
            style={{
              background: selectedAppointment ? '#7da0d7' : '#e2e8f0',
              color: selectedAppointment ? '#fff' : '#94a3b8',
              cursor: selectedAppointment ? 'pointer' : 'not-allowed',
            }}
          >
            Termin bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
