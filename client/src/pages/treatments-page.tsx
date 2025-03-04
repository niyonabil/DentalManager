import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTreatmentSchema, type Treatment, type Patient, type Medication } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Pill, Loader2 } from "lucide-react";

export default function TreatmentsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>();
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: treatments } = useQuery<Treatment[]>({
    queryKey: ["/api/patients", selectedPatient?.id, "treatments"],
    enabled: !!selectedPatient?.id,
  });

  const { data: medications } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const createTreatmentMutation = useMutation({
    mutationFn: async (treatment: any) => {
      const res = await apiRequest("POST", "/api/treatments", treatment);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "treatments"] });
      toast({
        title: "Succès",
        description: "Traitement ajouté avec succès",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: {
      patientId: 0,
      type: "",
      description: "",
      cost: 0,
      date: new Date().toISOString(),
      status: "completed",
      notes: "",
      medications: [],
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Traitements</h1>
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

          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={!selectedPatient}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Traitement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un traitement</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    if (selectedPatient) {
                      createTreatmentMutation.mutate({
                        ...data,
                        patientId: selectedPatient.id,
                      });
                    }
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de traitement</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="implant">Implant</SelectItem>
                            <SelectItem value="prothese">Prothèse</SelectItem>
                            <SelectItem value="orthodontie">Orthodontie</SelectItem>
                            <SelectItem value="extraction">Extraction</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût (€)</FormLabel>
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createTreatmentMutation.isPending}>
                    {createTreatmentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Enregistrer
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedPatient && treatments && (
        <div className="space-y-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{treatment.type}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(treatment.date).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-2">{treatment.description}</p>
                    <p className="mt-2 font-medium">{treatment.cost}€</p>
                    {treatment.notes && (
                      <p className="mt-2 text-sm text-gray-600">{treatment.notes}</p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Créer Document
                    </Button>
                    <Button variant="outline" size="sm">
                      <Pill className="h-4 w-4 mr-2" />
                      Prescrire
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
