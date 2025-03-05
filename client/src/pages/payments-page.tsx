import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentSchema, type Payment, type Patient, type Treatment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { Link } from 'wouter';

export default function PaymentsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>();
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: treatments } = useQuery<Treatment[]>({
    queryKey: ["/api/patients", selectedPatient?.id, "treatments"],
    enabled: !!selectedPatient?.id,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/patients", selectedPatient?.id, "payments"],
    enabled: !!selectedPatient?.id,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payment: any) => {
      try {
        const res = await apiRequest("POST", "/api/payments", payment);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create payment');
        return data;
      } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "treatments"] });
      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès",
      });
      form.reset();
      setOpenDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le paiement",
        variant: "destructive"
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      patientId: 0,
      treatmentId: 0,
      amount: 0,
      date: new Date(),
      type: "advance",
      notes: "",
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Paiements</h1>
        <div className="space-x-2">
          <select
            className="px-3 py-2 border rounded-md"
            onChange={(e) => {
              const patient = patients?.find(p => p.id === parseInt(e.target.value));
              setSelectedPatient(patient);
            }}
          >
            <option value="">Sélectionner un patient</option>
            {patients?.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Paiement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un paiement</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    if (selectedPatient) {
                      createPaymentMutation.mutate({
                        ...data,
                        patientId: selectedPatient.id,
                        date: new Date(data.date),
                      });
                    }
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="treatmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Traitement</FormLabel>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        >
                          <option value="">Sélectionner un traitement</option>
                          {treatments?.map((treatment) => (
                            <option key={treatment.id} value={treatment.id}>
                              {treatment.type} - {treatment.description} ({treatment.cost}€)
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de paiement</FormLabel>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="advance">Avance</option>
                          <option value="full">Paiement complet</option>
                          <option value="installment">Versement</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Enregistrer
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Link href="/patient-payments">
            <Button>Voir les paiements des patients</Button>
          </Link>
        </div>
      </div>

      {selectedPatient && payments && (
        <div className="space-y-4">
          {payments.map((payment) => {
            const treatment = treatments?.find(t => t.id === payment.treatmentId);
            return (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold capitalize">
                        {payment.type === "advance" ? "Avance" :
                         payment.type === "full" ? "Paiement complet" : "Versement"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.date).toLocaleDateString("fr-FR")}
                      </p>
                      {treatment && (
                        <p className="mt-2">
                          Traitement: {treatment.type} - {treatment.description}
                        </p>
                      )}
                      <p className="mt-2 font-medium">{payment.amount}€</p>
                      {payment.notes && (
                        <p className="mt-2 text-sm text-gray-600">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}