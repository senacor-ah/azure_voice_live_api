'use client';

import { Home, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = "home" | "accounts" | "profile";

interface BottomNavigationProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  className?: string;
}

export function BottomNavigation({
  activeItem,
  onNavigate,
  className,
}: BottomNavigationProps) {
  const navItems = [
    {
      id: "home" as NavItem,
      label: "Home",
      icon: Home,
    },
    {
      id: "accounts" as NavItem,
      label: "Accounts",
      icon: CreditCard,
    },
    {
      id: "profile" as NavItem,
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <nav
      className={cn(
        "grid grid-cols-3 gap-1",
        "px-2 py-2",
        "absolute bottom-0 left-0 right-0 z-50",
        className
      )}
      style={{background: '#fff', borderTop: '1px solid #e2e8f0'}}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl",
              "transition-all duration-200"
            )}
            style={isActive
              ? {color: '#7da0d7', fontWeight: 600, background: 'rgba(125,160,215,0.1)'}
              : {color: '#64748b'}}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "w-6 h-6 transition-transform",
                isActive && "scale-110"
              )}
            />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
