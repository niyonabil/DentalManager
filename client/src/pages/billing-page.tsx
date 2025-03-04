import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Patient, Document, InsertDocument, Treatment } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generatePDF, type DocumentData } from "@/lib/pdf-generator";
import { Plus, FileText, Printer, Loader2, Check } from "lucide-react";

// Function to convert number to words in French
function convertNumberToWords(num: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  
  let words = '';
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    words += (thousands === 1 ? 'mille ' : convertNumberToWords(thousands) + ' mille ');
    num %= 1000;
  }
  
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    words += (hundreds === 1 ? 'cent ' : convertNumberToWords(hundreds) + ' cent ');
    num %= 100;
  }
  
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
  
  return words.charAt(0).toUpperCase() + words.slice(1) + ' euros';
}

export default function BillingPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient>();
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/patients", selectedPatient?.id, "documents"],
    enabled: !!selectedPatient?.id,
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (document: InsertDocument) => {
      const res = await apiRequest("POST", "/api/documents", document);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatient?.id, "documents"] });
      toast({
        title: "Success",
        description: "Document créé avec succès",
      });
    },
  });

  const { data: treatments } = useQuery<Treatment[]>({
    queryKey: ["/api/patients", selectedPatient?.id, "treatments"],
    enabled: !!selectedPatient?.id,
  });

  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);

  const handleCreateDocument = async (type: string) => {
    if (!selectedPatient) return;
    
    // Calculate total cost from selected treatments
    const totalCost = selectedTreatments.length > 0 
      ? selectedTreatments.reduce((sum, t) => sum + t.cost, 0)
      : 100; // Default value if no treatments selected
    
    // Ensure all treatments have valid description and cost
    const validTreatments = selectedTreatments.map(t => ({
      treatmentId: t.id,
      description: t.description || "Traitement non spécifié",
      cost: t.cost || 0
    }));
    
    // Create document data for PDF generation
    const pdfDocumentData: DocumentData = {
      patient_name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      date: new Date().toLocaleDateString("fr-FR"),
      treatment_description: selectedTreatments.length > 0 
        ? selectedTreatments.map(t => t.description || "Traitement non spécifié").join(", ")
        : "Consultation dentaire",
      treatments: validTreatments,
      total_amount: totalCost,
      amount_in_words: convertNumberToWords(totalCost),
      amount_in_figures: `${totalCost},00 €`,
    };

    try {
      // Generate PDF first to catch any errors
      await generatePDF(type, pdfDocumentData);
      
      // If PDF generation succeeds, create document in database
      // Create a proper document object for the database
      createDocumentMutation.mutate({
        patientId: selectedPatient.id,
        type,
        data: pdfDocumentData,
        date: new Date(), // Use Date object instead of string
        items: validTreatments,
        total: totalCost,
      });
      
      // Reset selected treatments after document creation
      setSelectedTreatments([]);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le document PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Facturation</h1>
        <div className="space-x-2">
          <select
            className="px-3 py-2 border rounded-md"
            onChange={(e) => {
              const patient = patients?.find(p => p.id === parseInt(e.target.value));
              setSelectedPatient(patient);
              setSelectedTreatments([]);
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
                Nouveau Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un document</DialogTitle>
              </DialogHeader>
              {treatments && treatments.length > 0 && (
                <div className="space-y-4 mb-4">
                  <h3 className="font-medium">Sélectionner les traitements</h3>
                  <div className="space-y-2">
                    {treatments.map((treatment) => (
                      <div key={treatment.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium capitalize">{treatment.type}</div>
                          <div className="text-sm text-gray-500">{treatment.description}</div>
                          <div className="text-sm font-medium">{treatment.cost} €</div>
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => handleCreateDocument("facture")}
                  disabled={createDocumentMutation.isPending}
                >
                  {createDocumentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Facture
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleCreateDocument("devis")}
                  disabled={createDocumentMutation.isPending}
                >
                  {createDocumentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Devis
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleCreateDocument("note_honoraire")}
                  disabled={createDocumentMutation.isPending}
                >
                  {createDocumentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Note d'honoraire
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedPatient && documents && (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    {new Date(doc.date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="capitalize">{doc.type}</TableCell>
                  <TableCell>
                    {(doc.data as any)?.amount_in_figures || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => generatePDF(doc.type, doc.data as DocumentData)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DashboardLayout>
  );
}