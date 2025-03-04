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
import { Patient, Document, InsertDocument } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf-generator";
import { Plus, FileText, Printer, Loader2 } from "lucide-react";

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

  const form = useForm({
    defaultValues: {
      patientId: selectedPatient?.id,
      type: "invoice",
      data: {},
      date: new Date().toISOString(),
    },
  });

  const handleCreateDocument = async (type: string) => {
    if (!selectedPatient) return;

    const documentData = {
      patient_name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      date: new Date().toLocaleDateString("fr-FR"),
      treatment_description: "Consultation dentaire",
      amount_in_words: "Cent euros",
      amount_in_figures: "100.00 €",
    };

    createDocumentMutation.mutate({
      patientId: selectedPatient.id,
      type,
      data: documentData,
      date: new Date().toISOString(),
    });

    // Generate PDF
    await generatePDF(type, documentData);
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
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => handleCreateDocument("invoice")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Facture
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleCreateDocument("quote")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Devis
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleCreateDocument("note_honoraire")}
                >
                  <FileText className="h-4 w-4 mr-2" />
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
                  <TableCell>{(doc.data as any).amount_in_figures}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => generatePDF(doc.type, doc.data)}
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
