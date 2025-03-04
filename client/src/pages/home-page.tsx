import DashboardLayout from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient, Appointment } from "@shared/schema";
import { Calendar, Users, FileText } from "lucide-react";

export default function HomePage() {
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const stats = [
    {
      title: "Total Patients",
      value: patients?.length || 0,
      icon: Users,
    },
    {
      title: "Rendez-vous Aujourd'hui",
      value: appointments?.filter(a => 
        new Date(a.date).toDateString() === new Date().toDateString()
      ).length || 0,
      icon: Calendar,
    },
    {
      title: "Traitements en cours",
      value: patients?.filter(p => 
        (p.medicalHistory as any[])?.some(h => h.status === "in_progress")
      ).length || 0,
      icon: FileText,
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add more dashboard content here */}
    </DashboardLayout>
  );
}
