import { CreditCard, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transfer {
  id: string;
  recipient: string;
  iban: string;
  amount: number;
  currency: string;
  purpose?: string;
}

interface TransferConfirmationProps {
  transfer: Transfer | null;
  isOpen: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

export function TransferConfirmation({
  transfer,
  isOpen,
  onConfirm,
  onReject,
}: TransferConfirmationProps) {
  if (!isOpen || !transfer) return null;

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Überweisung bestätigen</h2>
          <p className="text-sm text-muted-foreground">
            Bitte prüfen Sie die Angaben und bestätigen Sie die Überweisung
          </p>
        </div>

        {/* Transfer Details */}
        <div className="space-y-4 mb-6">
          <div className="glass-card rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-muted-foreground">Empfänger</span>
              <span className="font-medium text-right">{transfer.recipient}</span>
            </div>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-muted-foreground">IBAN</span>
              <span className="font-mono text-sm text-right break-all">
                {transfer.iban}
              </span>
            </div>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-muted-foreground">Betrag</span>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(transfer.amount, transfer.currency)}
              </span>
            </div>
            {transfer.purpose && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">
                  Verwendungszweck
                </span>
                <span className="text-sm text-right">{transfer.purpose}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}