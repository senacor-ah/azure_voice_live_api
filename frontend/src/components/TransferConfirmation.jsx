/**
 * Überweisungsbestätigungs-Dialog
 * Wird durch Agent Function Call ausgelöst
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, X, Euro } from 'lucide-react';

export default function TransferConfirmation({ 
  transferData, 
  onConfirm, 
  onReject,
  isOpen 
}) {
  if (!isOpen) return null;

  // Parse transfer data
  const data = typeof transferData === 'string' ? JSON.parse(transferData) : transferData;
  
  const {
    recipient = 'Unbekannt',
    iban = 'DEXX XXXX XXXX XXXX XXXX XX',
    amount = 0,
    currency = 'EUR',
    purpose = 'Keine Angabe'
  } = data;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Euro className="h-6 w-6" />
              Überweisungsbestätigung
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onReject}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Bitte prüfen Sie die Überweisungsdetails und bestätigen Sie
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Betrag - Prominent */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">
              {Number(amount).toFixed(2)} {currency}
            </div>
          </div>
          
          <Separator />
          
          {/* Empfänger */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Empfänger:</span>
              <span className="font-medium text-right">{recipient}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">IBAN:</span>
              <span className="font-mono text-xs text-right">{iban}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Verwendungszweck:</span>
              <span className="text-sm text-right max-w-[200px]">{purpose}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Warnung */}
          <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-500">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Bitte überprüfen Sie alle Angaben sorgfältig. Diese Aktion kann nicht rückgängig gemacht werden.
            </span>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onReject}
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onConfirm}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Bestätigen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

