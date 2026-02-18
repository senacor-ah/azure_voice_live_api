'use client';

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
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{background: 'rgba(0,0,0,0.35)'}}>
      <div className="rounded-2xl max-w-md w-full p-6 animate-scale-in" style={{background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0'}}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: 'rgba(125,160,215,0.12)'}}>
            <CreditCard className="w-8 h-8" style={{color: '#7da0d7'}} />
          </div>
          <h2 className="text-xl font-bold mb-2">Überweisung bestätigen</h2>
          <p className="text-sm" style={{color: '#64748b'}}>
            Bitte prüfen Sie die Angaben und bestätigen Sie die Überweisung
          </p>
        </div>

        {/* Transfer Details */}
        <div className="space-y-4 mb-6">
          <div className="rounded-xl p-4" style={{background: 'rgba(125,160,215,0.08)', border: '1px solid rgba(125,160,215,0.25)'}}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm" style={{color: '#64748b'}}>Empfänger</span>
              <span className="font-medium text-right">{transfer.recipient}</span>
            </div>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm" style={{color: '#64748b'}}>IBAN</span>
              <span className="font-mono text-sm text-right break-all">{transfer.iban}</span>
            </div>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm" style={{color: '#64748b'}}>Betrag</span>
              <span className="font-bold text-lg" style={{color: '#7da0d7'}}>
                {formatCurrency(transfer.amount, transfer.currency)}
              </span>
            </div>
            {transfer.purpose && (
              <div className="flex items-start justify-between">
                <span className="text-sm" style={{color: '#64748b'}}>Verwendungszweck</span>
                <span className="text-sm text-right">{transfer.purpose}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
            style={{border: '1px solid #e2e8f0', background: '#f8faff', color: '#1a1a2e'}}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors text-white"
            style={{background: '#7da0d7'}}
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}