
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
import DashboardLayout from "@/components/layout/dashboard-layout";
import AppointmentPayment from "@/components/appointment-payment";

// Define interfaces for type safety
interface Appointment {
  id: number;
  patientId: number;
  date: string;
  time: string;
  duration: number;
  status?: string;
  reason?: string;
  notes?: string;
  isUrgent?: boolean;
  isPassenger?: boolean;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  cin: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface EditingAppointment {
  id: number;
  patientId: number;
  date: string;
  time: string;
  duration: number;
  reason?: string;
  notes?: string;
}

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingAppointment, setEditingAppointment] = useState<EditingAppointment | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    patientId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration: 30,
    reason: "",
    notes: "",
  });
  const [calendarAppointments, setCalendarAppointments] = useState<{[date: string]: Appointment[]}>({});
  const { settings } = useSettings();

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointmentsByDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de récupérer les rendez-vous"
        });
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des rendez-vous"
      });
    }
  };

  const fetchAppointmentsByDate = async (date: Date) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(`/api/appointments?date=${formattedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de récupérer les rendez-vous pour cette date"
        });
      }
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des rendez-vous"
      });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAppointmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setAppointmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (isEditing = false) => {
    try {
      if (!appointmentData.patientId || !appointmentData.date || !appointmentData.time) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires"
        });
        return;
      }

      const formattedData = {
        ...appointmentData,
        patientId: parseInt(appointmentData.patientId),
        duration: parseInt(appointmentData.duration.toString())
      };

      const url = isEditing && editingAppointment ? `/api/appointments/${editingAppointment.id}` : "/api/appointments";
      const method = isEditing ? "PATCH" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        toast({
          title: isEditing ? "Rendez-vous modifié" : "Rendez-vous créé",
          description: isEditing ? "Le rendez-vous a été modifié avec succès" : "Le rendez-vous a été créé avec succès",
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
        const errorText = await response.text();
        toast({
          variant: "destructive",
          title: "Erreur",
          description: `Échec de la création du rendez-vous: ${errorText}`,
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

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment({
      id: appointment.id,
      patientId: appointment.patientId,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      reason: appointment.reason,
      notes: appointment.notes,
    });
    const [hours, minutes] = appointment.time.split(':');
    setAppointmentData({
      patientId: appointment.patientId.toString(),
      date: format(new Date(appointment.date), "yyyy-MM-dd"),
      time: `${hours}:${minutes}`,
      duration: appointment.duration,
      reason: appointment.reason || "",
      notes: appointment.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleComplete = async (appointmentId: number) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (response.ok) {
        toast({
          title: "Rendez-vous terminé",
          description: "Le rendez-vous a été marqué comme terminé",
        });
        fetchAppointments();
      }
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rendez-vous",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rendez-vous</h1>
            <p className="text-muted-foreground">
              Gérez les rendez-vous des patients
            </p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Nouveau Rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAppointment ? "Modifier le rendez-vous" : "Ajouter un rendez-vous"}</DialogTitle>
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
              <Button onClick={() => handleSubmit(!!editingAppointment)}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md w-full"
                modifiers={{
                  hasAppointment: (date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    return appointments.some(apt => format(new Date(apt.date), "yyyy-MM-dd") === dateStr);
                  }
                }}
                modifiersStyles={{
                  hasAppointment: { fontWeight: "bold", textDecoration: "underline", color: "var(--primary)" }
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const dayAppointments = appointments.filter(apt => 
                      format(new Date(apt.date), "yyyy-MM-dd") === dateStr
                    );
                    
                    return (
                      <div className="relative h-full w-full flex flex-col items-center">
                        <div>{date.getDate()}</div>
                        {dayAppointments.length > 0 && (
                          <div className="text-[0.65rem] mt-1 text-primary font-medium">
                            {dayAppointments.length} RDV
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, "dd MMMM yyyy") : "Sélectionnez une date"}
              </CardTitle>
              <CardDescription>
                {appointments.filter(apt => 
                  selectedDate && format(new Date(apt.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                ).length} rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {appointments
                .filter(apt => 
                  selectedDate && format(new Date(apt.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                )
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(apt => {
                  const patient = patients.find(p => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="mb-3 p-2 border rounded-md">
                      <div className="font-medium">{patient?.firstName} {patient?.lastName}</div>
                      <div className="text-sm">{apt.time} - {apt.duration} min</div>
                      {apt.reason && <div className="text-sm text-gray-500">{apt.reason}</div>}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
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
            const patient = patients.find((p) => p.id === appointment.patientId);
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
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(appointment)}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <AppointmentPayment 
                      appointmentId={appointment.id} 
                      patientId={appointment.patientId} 
                      onPaymentComplete={fetchAppointments} 
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleComplete(appointment.id)}>
                    Compléter
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
