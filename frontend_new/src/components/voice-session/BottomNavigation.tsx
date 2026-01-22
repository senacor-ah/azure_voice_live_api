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
        "glass-card border-t border-border/50",
        "grid grid-cols-3 gap-1",
        "px-2 py-2 pb-safe",
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-lg",
        "mx-auto",
        "max-w-[430px]",
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl",
              "transition-all duration-200",
              "hover:bg-primary/10",
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
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
