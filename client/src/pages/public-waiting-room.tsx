import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Appointment, Patient } from "@shared/schema";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaitingAppointment extends Appointment {
  patient?: Patient;
}

export default function PublicWaitingRoom() {
  const [waitingList, setWaitingList] = useState<WaitingAppointment[]>([]);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    refetchInterval: 30000,
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
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

      setWaitingList(todayAppointments);
    }
  }, [appointments, patients]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Salle d'attente</h1>
        
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
                        "p-4 rounded-lg",
                        appointment.isUrgent ? "bg-red-50" : "bg-gray-50",
                        appointment.isPassenger ? "border-2 border-blue-200" : ""
                      )}
                    >
                      <div className="font-medium">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
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
                      <div className="font-medium">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
