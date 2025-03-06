import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface AppointmentPaymentProps {
  appointmentId: number;
  patientId: number;
  onPaymentComplete: () => void;
}

interface PaymentData {
  appointmentId: number;
  patientId: number;
  amount: number;
  method: string;
  date: string;
  notes: string;
}

export default function AppointmentPayment({ appointmentId, patientId, onPaymentComplete }: AppointmentPaymentProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    appointmentId,
    patientId,
    amount: 0,
    method: "cash",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!paymentData.amount || paymentData.amount <= 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez entrer un montant valide"
        });
        return;
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...paymentData,
          amount: Number(paymentData.amount),
          date: new Date(paymentData.date),
        }),
      });

      if (response.ok) {
        toast({
          title: "Paiement enregistré",
          description: "Le paiement a été enregistré avec succès",
        });
        setIsDialogOpen(false);
        onPaymentComplete();
      } else {
        const errorText = await response.text();
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Échec de l'enregistrement du paiement: ${errorText}`,
        });
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du paiement",
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ajouter un paiement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Montant</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={paymentData.amount}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="method">Méthode de paiement</Label>
            <Select
              name="method"
              value={paymentData.method}
              onValueChange={(value) => handleSelectChange("method", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="card">Carte bancaire</SelectItem>
                <SelectItem value="check">Chèque</SelectItem>
                <SelectItem value="transfer">Virement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={paymentData.date}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={paymentData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}