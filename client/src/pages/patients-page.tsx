import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { PatientForm } from "@/components/patients/patient-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Patient, InsertPatient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Link from 'next/link';


export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patient: InsertPatient) => {
      const res = await apiRequest("POST", "/api/patients", patient);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient ajouté avec succès",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient supprimé avec succès",
      });
    },
  });

  const filteredPatients = patients?.filter(patient =>
    patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
  };

  const handleCloseEditDialog = () => {
    setEditingPatient(null);
  };


  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ajouter un patient</DialogTitle>
            </DialogHeader>
            <PatientForm
              onSubmit={(data) => {
                createPatientMutation.mutate(data);
              }}
              isLoading={createPatientMutation.isPending}
              onClose={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients?.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.address}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
                          deletePatientMutation.mutate(patient.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {/*Added Payment Link */}
                    <Link href={`/payments?patientId=${patient.id}`} >
                      <Button variant="ghost" size="icon">Paiements</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Edit Patient Dialog */}
      <Dialog open={editingPatient !== null} onClose={handleCloseEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le patient</DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <PatientForm
              initialValues={editingPatient}
              onSubmit={() => {
                handleCloseEditDialog();
              }}
              isLoading={false}
              onClose={handleCloseEditDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}