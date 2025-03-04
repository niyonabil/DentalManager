import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, FileText, Pill, Loader2, Check } from "lucide-react";
import { generatePDF, type DocumentData } from "@/lib/pdf-generator";

// Fonction pour convertir un nombre en texte (en français)
function convertNumberToWords(num: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  
  let words = '';
  
  // Pour les milliers
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    words += (thousands === 1 ? 'mille ' : convertNumberToWords(thousands) + ' mille ');
    num %= 1000;
  }
  
  // Pour les centaines
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    words += (hundreds === 1 ? 'cent ' : convertNumberToWords(hundreds) + ' cent ');
    num %= 100;
  }
  
  // Pour les dizaines et unités
  if (num > 0) {
    if (num < 20) {
      words += units[num];
    } else {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      
      if (ten === 7 || ten === 9) {
        words += tens[ten - 1] + '-';
        words += (unit === 1 ? 'et-' : '') + units[10 + unit];
      } else {
        words += tens[ten];
        if (unit > 0) {
          words += (unit === 1 && ten !== 8 ? '-et-' : '-') + units[unit];
        } else if (ten === 8) {
          words += 's';
        }
      }
    }
  }
  
  // Première lettre en majuscule
  return words.charAt(0).toUpperCase() + words.slice(1) + ' euros';
}

export default function TreatmentsPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>();
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
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
      try {
        const res = await apiRequest("POST", "/api/treatments", treatment);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create treatment');
        return data;
      } catch (error) {
        console.error('Error creating treatment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "treatments"] });
      toast({
        title: "Succès",
        description: "Traitement ajouté avec succès",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le traitement",
        variant: "destructive"
      });
    }
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
          {selectedTreatments.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Générer Document ({selectedTreatments.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const totalCost = selectedTreatments.reduce((sum, t) => sum + t.cost, 0);
                      const documentData: DocumentData = {
                        patient_name: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
                        date: new Date().toLocaleDateString("fr-FR"),
                        treatments: selectedTreatments.map(t => ({
                          description: t.description,
                          cost: t.cost
                        })),
                        total_amount: totalCost,
                        amount_in_words: convertNumberToWords(totalCost),
                        amount_in_figures: `${totalCost},00 DH`
                      };
                      generatePDF("facture", documentData);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Facture
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      const totalCost = selectedTreatments.reduce((sum, t) => sum + t.cost, 0);
                      const documentData: DocumentData = {
                        patient_name: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
                        date: new Date().toLocaleDateString("fr-FR"),
                        treatments: selectedTreatments.map(t => ({
                          description: t.description,
                          cost: t.cost
                        })),
                        total_amount: totalCost,
                        amount_in_words: convertNumberToWords(totalCost),
                        amount_in_figures: `${totalCost},00 DH`
                      };
                      generatePDF("devis", documentData);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Devis
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      const totalCost = selectedTreatments.reduce((sum, t) => sum + t.cost, 0);
                      const documentData: DocumentData = {
                        patient_name: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
                        date: new Date().toLocaleDateString("fr-FR"),
                        treatments: selectedTreatments.map(t => ({
                          description: t.description,
                          cost: t.cost
                        })),
                        total_amount: totalCost,
                        amount_in_words: convertNumberToWords(totalCost),
                        amount_in_figures: `${totalCost},00 DH`
                      };
                      generatePDF("note_honoraire", documentData);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Note d'honoraire
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
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
                        <FormLabel>Coût (DH)</FormLabel>
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
                    <p className="mt-2 font-medium">{treatment.cost}DH</p>
                    {treatment.notes && (
                      <p className="mt-2 text-sm text-gray-600">{treatment.notes}</p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const isSelected = selectedTreatments.some(t => t.id === treatment.id);
                        if (isSelected) {
                          setSelectedTreatments(selectedTreatments.filter(t => t.id !== treatment.id));
                        } else {
                          setSelectedTreatments([...selectedTreatments, treatment]);
                        }
                      }}
                    >
                      {selectedTreatments.some(t => t.id === treatment.id) ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {selectedTreatments.some(t => t.id === treatment.id) ? 'Sélectionné' : 'Sélectionner'}
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
