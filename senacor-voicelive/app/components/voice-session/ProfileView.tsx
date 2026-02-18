'use client';

import React from 'react';
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
  const profileSections: Array<{
    title: string;
    items: Array<{
      icon: React.ComponentType<{className?: string; style?: React.CSSProperties}>;
      label: string;
      value?: string;
      action?: boolean;
    }>;
  }> = [
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
      <div className="rounded-2xl p-6 text-center" style={{background: '#fff', border: '1px solid #e2e8f0'}}>
        <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{background: 'linear-gradient(135deg, #7da0d7, #b3cce8)'}}>
          <User className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-1">{userName}</h2>
        <p className="text-sm text-muted-foreground">Kunde seit Januar 2020</p>
      </div>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-3">
          <h3 className="text-sm font-semibold px-1" style={{color: '#64748b'}}>{section.title}</h3>
          <div className="rounded-xl" style={{background: '#fff', border: '1px solid #e2e8f0'}}>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIndex}
                  className="w-full p-4 flex items-center justify-between transition-colors text-left"
                  style={{borderBottom: itemIndex < section.items.length - 1 ? '1px solid #f1f5f9' : 'none'}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'rgba(125,160,215,0.12)'}}>
                      <Icon className="w-5 h-5" style={{color: '#7da0d7'}} />
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
      <button className="rounded-xl p-4 w-full flex items-center justify-center gap-2 transition-colors" style={{background: '#fff', border: '1px solid #fecaca', color: '#ef4444'}}>
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Abmelden</span>
      </button>

      {/* Bottom Spacing for Navigation */}
      <div className="h-4" />
    </div>
  );
}
