import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Appointment, Patient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaitingAppointment extends Appointment {
  patient?: Patient;
}

export default function WaitingRoomPage() {
  const { toast } = useToast();
  const [waitingList, setWaitingList] = useState<WaitingAppointment[]>([]);

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  useEffect(() => {
    if (appointments && patients) {
      const today = new Date().toDateString();
      const todayAppointments = appointments
        .filter(apt => new Date(apt.date).toDateString() === today)
        .map(apt => ({
          ...apt,
          patient: patients.find(p => p.id === apt.patientId),
        }))
        .sort((a, b) => {
          // Sort by urgency first
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          // Then by appointment time
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

      setWaitingList(todayAppointments);
    }
  }, [appointments, patients]);

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      const statusMessages = {
        "in_progress": "Patient appelé en consultation",
        "completed": "Consultation terminée"
      };
      
      toast({
        title: "Success",
        description: statusMessages[variables.status as keyof typeof statusMessages] || "Liste d'attente mise à jour",
      });
    },
  });

  const handleCallPatient = (appointment: WaitingAppointment) => {
    updateAppointmentMutation.mutate({
      id: appointment.id,
      status: "in_progress",
    });
  };

  const isLoading = isLoadingAppointments || isLoadingPatients;

  const getPatientStatus = (appointment: WaitingAppointment) => {
    const statusIndicators = [];
    if (appointment.isUrgent) statusIndicators.push("🚨 Urgent");
    if (appointment.isPassenger) statusIndicators.push("👤 Passager");
    return statusIndicators.join(" • ");
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Salle d'attente</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                En attente
              </h2>
              <div className="space-y-4">
                {waitingList
                  .filter(apt => apt.status === "scheduled")
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg",
                        appointment.isUrgent ? "bg-red-50" : "bg-gray-50",
                        appointment.isPassenger ? "border-2 border-blue-200" : ""
                      )}
                    >
                      <div>
                        <div className="font-medium">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          {getPatientStatus(appointment)}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCallPatient(appointment)}
                        disabled={updateAppointmentMutation.isPending}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Appeler
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                En consultation
              </h2>
              <div className="space-y-4">
                {waitingList
                  .filter(apt => apt.status === "in_progress")
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "p-4 rounded-lg",
                        appointment.isUrgent ? "bg-red-50" : "bg-primary/10",
                        appointment.isPassenger ? "border-2 border-blue-200" : ""
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-sm font-medium text-primary">
                            {getPatientStatus(appointment)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateAppointmentMutation.mutate({
                            id: appointment.id,
                            status: "completed"
                          })}
                          disabled={updateAppointmentMutation.isPending}
                        >
                          {updateAppointmentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Terminer
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}