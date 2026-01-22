import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileViewProps {
  userName?: string;
  className?: string;
}

export function ProfileView({
  userName = "Anton Happel",
  className,
}: ProfileViewProps) {
  const profileSections = [
    {
      title: "Persönliche Informationen",
      items: [
        {
          icon: User,
          label: "Name",
          value: userName,
        },
        {
          icon: Mail,
          label: "E-Mail",
          value: "anton.happel@example.com",
        },
        {
          icon: Phone,
          label: "Telefon",
          value: "+49 170 1234567",
        },
        {
          icon: MapPin,
          label: "Adresse",
          value: "Musterstraße 123, 12345 Berlin",
        },
      ],
    },
    {
      title: "Einstellungen",
      items: [
        {
          icon: Bell,
          label: "Benachrichtigungen",
          action: true,
        },
        {
          icon: Shield,
          label: "Sicherheit & Datenschutz",
          action: true,
        },
        {
          icon: CreditCard,
          label: "Zahlungsmethoden",
          action: true,
        },
        {
          icon: Settings,
          label: "Allgemeine Einstellungen",
          action: true,
        },
      ],
    },
  ];

  return (
    <div className={cn("p-4 space-y-6", className)}>
      {/* Profile Header */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 mx-auto mb-4 flex items-center justify-center">
          <User className="w-12 h-12 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-1">{userName}</h2>
        <p className="text-sm text-muted-foreground">Kunde seit Januar 2020</p>
      </div>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            {section.title}
          </h3>
          <div className="glass-card rounded-xl divide-y divide-border/50">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIndex}
                  className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      {item.value && (
                        <p className="text-xs text-muted-foreground">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.action && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button className="glass-card rounded-xl p-4 w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Abmelden</span>
      </button>

      {/* Bottom Spacing for Navigation */}
      <div className="h-4" />
    </div>
  );
}
