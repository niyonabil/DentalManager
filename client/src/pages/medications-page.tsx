import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMedicationSchema, type Medication } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle, PackagePlus, Loader2 } from "lucide-react";

export default function MedicationsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const { data: medications } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const currencySymbol = settings?.currencySymbol || "€";

  const createMedicationMutation = useMutation({
    mutationFn: async (medication: any) => {
      // Convertir les chaînes numériques en nombres
      const sanitizedMedication = {
        ...medication,
        currentStock: Number(medication.currentStock),
        minimumStock: Number(medication.minimumStock),
        price: medication.price ? Number(medication.price) : undefined,
        lastRestockDate: medication.lastRestockDate ? new Date(medication.lastRestockDate).toISOString() : null
      };

      console.log("Envoi du médicament:", sanitizedMedication);
      const res = await apiRequest("POST", "/api/medications", sanitizedMedication);

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Succès",
        description: "Médicament ajouté avec succès",
      });
    },
    onError: (error) => {
      console.error("Medication creation error:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du médicament: " + (error instanceof Error ? error.message : "Erreur inconnue"),
        variant: "destructive",
      });
    },
  });

  const updateMedicationMutation = useMutation({
    mutationFn: async (medication: any) => {
      const sanitizedMedication = {
        ...medication,
        currentStock: Number(medication.currentStock),
        minimumStock: Number(medication.minimumStock),
        price: medication.price ? Number(medication.price) : undefined,
        lastRestockDate: medication.lastRestockDate ? new Date(medication.lastRestockDate).toISOString() : null
      };

      const res = await apiRequest("PATCH", `/api/medications/${medication.id}`, sanitizedMedication);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      setEditingMedication(null);
      toast({
        title: "Succès",
        description: "Médicament mis à jour avec succès",
      });
    },
    onError: (error) => {
      console.error("Medication update error:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du médicament: " + (error instanceof Error ? error.message : "Erreur inconnue"),
        variant: "destructive",
      });
    }
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Succès",
        description: "Médicament supprimé avec succès",
      });
    },
    onError: (error) => {
      console.error("Medication delete error:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du médicament: " + (error instanceof Error ? error.message : "Erreur inconnue"),
        variant: "destructive",
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(insertMedicationSchema),
    defaultValues: {
      name: "",
      description: "",
      currentStock: 0,
      minimumStock: 0,
      unit: "",
      price: 0,
      supplier: "",
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Médicaments</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Médicament
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un médicament</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMedicationMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock actuel</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock minimum</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix ({currencySymbol})</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createMedicationMutation.isPending}>
                  {createMedicationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Enregistrer
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications?.map((medication) => (
          <Card key={medication.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{medication.name}</h3>
                  <p className="text-sm text-gray-500">{medication.description}</p>
                  <div className="mt-2 space-y-1">
                    <p>Stock: {medication.currentStock} {medication.unit}</p>
                    <p>Prix: {medication.price ? `${medication.price} ${currencySymbol}` : 'N/A'}</p>
                    {medication.supplier && (
                      <p className="text-sm text-gray-600">Fournisseur: {medication.supplier}</p>
                    )}
                  </div>
                </div>
                {medication.currentStock <= medication.minimumStock && (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Réapprovisionner
                </Button>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setEditingMedication(medication)}>
                    Modifier
                </Button>
                <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => deleteMedicationMutation.mutate(medication.id)}>
                    Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}