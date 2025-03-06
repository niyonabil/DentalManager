import React, { useState } from "react";
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
import { Plus, FileText, Pill, Loader2, Check, Trash, Calendar } from "lucide-react";
import { generatePDF, type DocumentData } from "@/lib/pdf-generator";
import { DentalChart } from "@/components/dental-chart";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { z } from "zod";

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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
  const { toast } = useToast();
  const currencySymbol = "DH"; // Placeholder - fetch from settings later

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
        // Assurez-vous que le patientId est inclus
        if (!treatment.patientId && selectedPatient) {
          treatment.patientId = selectedPatient.id;
        }

        const sanitizedTreatment = {
          ...treatment,
          date: new Date(treatment.date),
          medications: Array.isArray(treatment.medications) ? treatment.medications : [],
          selectedTeeth: Array.isArray(treatment.selectedTeeth) ? treatment.selectedTeeth : []
        };

        console.log("Envoi du traitement:", sanitizedTreatment);
        const res = await apiRequest("POST", "/api/treatments", sanitizedTreatment);

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${await res.text()}`);
        }

        return res.json();
      } catch (error) {
        console.error("Error creating treatment:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "treatments"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Traitement ajouté avec succès",
      });
    },
    onError: (error) => {
      console.error("Treatment creation error:", error);
      toast({
        title: "Error",
        description: "Erreur lors de l'ajout du traitement: " + (error instanceof Error ? error.message : "Erreur inconnue"),
        variant: "destructive",
      });
    },
  });

  const updateTreatmentMutation = useMutation({
    mutationFn: async (treatment: any) => {
      try {
        const sanitizedTreatment = {
          ...treatment,
          date: treatment.date instanceof Date ? treatment.date.toISOString() : new Date(treatment.date).toISOString(),
          medications: Array.isArray(treatment.medications) ? treatment.medications : [],
          selectedTeeth: Array.isArray(treatment.selectedTeeth) ? treatment.selectedTeeth : []
        };
        
        console.log("Mise à jour du traitement:", sanitizedTreatment);
        const res = await apiRequest("PATCH", `/api/treatments/${treatment.id}`, sanitizedTreatment);
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${await res.text()}`);
        }
        
        return res.json();
      } catch (error) {
        console.error("Error updating treatment:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "treatments"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Traitement mis à jour avec succès",
      });
    },
    onError: (error) => {
      console.error("Treatment update error:", error);
      toast({
        title: "Error",
        description: "Erreur lors de la mise à jour du traitement: " + (error instanceof Error ? error.message : "Erreur inconnue"),
        variant: "destructive",
      });
    },
  });

  const deleteTreatmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/treatments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "treatments"] });
      toast({
        title: "Success",
        description: "Traitement supprimé avec succès",
      });
    },
  });

  // Define a schema for treatment line items
  const treatmentLineSchema = z.object({
    description: z.string().min(1, "Description requise"),
    cost: z.number().min(0, "Le coût doit être positif")
  });

  // Extended form schema with treatment lines
  const extendedTreatmentSchema = insertTreatmentSchema.extend({
    documentNumber: z.string().optional(),
    treatmentLines: z.array(treatmentLineSchema).min(1, "Au moins une ligne de traitement est requise"),
    patientType: z.enum(["adult", "child"]).default("adult")
  });

  const form = useForm({
    resolver: zodResolver(extendedTreatmentSchema),
    defaultValues: {
      patientId: 0,
      type: "",
      description: "",
      cost: 0,
      date: new Date(),
      status: "completed",
      notes: "",
      medications: [],
      selectedTeeth: [],
      documentNumber: "",
      treatmentLines: [{ description: "", cost: 0 }],
      patientType: "adult"
    },
  });
  
  // Helper function to add a treatment line
  const addTreatmentLine = () => {
    const currentLines = form.getValues("treatmentLines") || [];
    form.setValue("treatmentLines", [...currentLines, { description: "", cost: 0 }]);
  };

  // Helper function to remove a treatment line
  const removeTreatmentLine = (index: number) => {
    const currentLines = form.getValues("treatmentLines") || [];
    if (currentLines.length > 1) {
      form.setValue("treatmentLines", currentLines.filter((_, i) => i !== index));
    }
  };

  // Calculate total cost from treatment lines
  const calculateTotalCost = () => {
    const treatmentLines = form.getValues("treatmentLines") || [];
    return treatmentLines.reduce((sum, line) => sum + (line.cost || 0), 0);
  };
  
  // Update the cost field when treatment lines change
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('treatmentLines')) {
        form.setValue("cost", calculateTotalCost());
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


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
                        amount_in_figures: `${totalCost},00 ${currencySymbol}`
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
                        amount_in_figures: `${totalCost},00 ${currencySymbol}`
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
                        amount_in_figures: `${totalCost},00 ${currencySymbol}`
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
              setSelectedPatient(patient || null);
            }}
          >
            <option value="">Sélectionner un patient</option>
            {patients?.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedPatient} onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Traitement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 gap-4">
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
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={"w-full pl-3 text-left font-normal"}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "dd/MM/yyyy")
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  field.onChange(date || new Date());
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de document</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Numéro de facture ou bon" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de patient</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="adult">Adulte</SelectItem>
                            <SelectItem value="child">Enfant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selectedTeeth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sélectionner les dents concernées</FormLabel>
                        <FormControl>
                          <DentalChart
                            selectedTeeth={field.value}
                            onChange={field.onChange}
                            patientType={form.getValues("patientType") as "adult" | "child"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <FormLabel>Lignes de traitement</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={addTreatmentLine}>
                        <Plus className="h-4 w-4 mr-2" /> Ajouter une ligne
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[150px]">Coût ({currencySymbol})</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.getValues("treatmentLines").map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`treatmentLines.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input {...field} placeholder="Description du traitement" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`treatmentLines.${index}.cost`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTreatmentLine(index)}
                                disabled={form.getValues("treatmentLines").length <= 1}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

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
                    <p className="mt-2 font-medium">{treatment.cost} {currencySymbol}</p>
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