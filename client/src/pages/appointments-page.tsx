
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/hooks/use-settings";

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    patientId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration: 30,
    reason: "",
    notes: "",
  });
  const { settings } = useSettings();

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setAppointmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        toast({
          title: "Rendez-vous créé",
          description: "Le rendez-vous a été créé avec succès",
        });
        fetchAppointments();
        setIsAddDialogOpen(false);
        setAppointmentData({
          patientId: "",
          date: format(new Date(), "yyyy-MM-dd"),
          time: "09:00",
          duration: 30,
          reason: "",
          notes: "",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Échec de la création du rendez-vous",
        });
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du rendez-vous",
      });
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rendez-vous</h1>
          <p className="text-muted-foreground">
            Gérez les rendez-vous des patients
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Nouveau Rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un rendez-vous</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="patient">Patient</Label>
                <Select
                  name="patientId"
                  value={appointmentData.patientId}
                  onValueChange={(value) => handleSelectChange("patientId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={appointmentData.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Heure</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={appointmentData.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={appointmentData.duration}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Motif</Label>
                <Input
                  id="reason"
                  name="reason"
                  value={appointmentData.reason}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={appointmentData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucun rendez-vous trouvé. Ajoutez votre premier rendez-vous en cliquant sur le bouton ci-dessus.
              </p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => {
            const patient = patients.find(p => p.id === appointment.patientId);
            return (
              <Card key={appointment.id}>
                <CardHeader>
                  <CardTitle>
                    <Link href={`/patients/${appointment.patientId}`}>
                      <span className="hover:underline">
                        {patient ? `${patient.firstName} ${patient.lastName}` : "Patient inconnu"}
                      </span>
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(appointment.date), "dd/MM/yyyy")} à {appointment.time} - {appointment.duration} min
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div>
                      <span className="font-semibold">Motif:</span> {appointment.reason}
                    </div>
                    {appointment.notes && (
                      <div>
                        <span className="font-semibold">Notes:</span> {appointment.notes}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm">
                    Compléter
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
