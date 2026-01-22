import { CreditCard, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  iban: string;
  balance: number;
  currency: string;
  type: "checking" | "savings" | "credit";
}

interface AccountsViewProps {
  className?: string;
}

export function AccountsView({ className }: AccountsViewProps) {
  // Demo data
  const accounts: Account[] = [
    {
      id: "1",
      name: "Girokonto",
      iban: "DE89 3704 0044 0532 0130 00",
      balance: 5847.32,
      currency: "EUR",
      type: "checking",
    },
    {
      id: "2",
      name: "Sparkonto",
      iban: "DE89 3704 0044 0532 0130 01",
      balance: 12500.0,
      currency: "EUR",
      type: "savings",
    },
    {
      id: "3",
      name: "Kreditkarte",
      iban: "**** **** **** 4532",
      balance: -342.18,
      currency: "EUR",
      type: "credit",
    },
  ];

  const recentTransactions = [
    {
      id: "1",
      description: "REWE Supermarkt",
      amount: -45.67,
      date: "Heute, 14:32",
      type: "expense" as const,
    },
    {
      id: "2",
      description: "Gehalt",
      amount: 3200.0,
      date: "Gestern, 09:15",
      type: "income" as const,
    },
    {
      id: "3",
      description: "Amazon",
      amount: -89.99,
      date: "12.01.2026",
      type: "expense" as const,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Total Balance */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <p className="text-sm text-muted-foreground mb-1">Gesamtvermögen</p>
        <p className="text-3xl font-bold">{formatCurrency(18005.14)}</p>
      </div>

      {/* Accounts */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          Meine Konten
        </h2>
        {accounts.map((account) => (
          <button
            key={account.id}
            className="glass-card rounded-xl p-4 w-full text-left hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.iban}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <p
              className={cn(
                "text-xl font-bold",
                account.balance < 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {formatCurrency(account.balance)}
            </p>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground px-1">
          Letzte Transaktionen
        </h2>
        <div className="glass-card rounded-xl divide-y divide-border/50">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    transaction.type === "income"
                      ? "bg-success/10"
                      : "bg-destructive/10"
                  )}
                >
                  {transaction.type === "income" ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
              <p
                className={cn(
                  "font-bold",
                  transaction.type === "income"
                    ? "text-success"
                    : "text-foreground"
                )}
              >
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
