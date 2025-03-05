import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Treatment, Medication } from "@shared/schema";
import { DentalChart } from "./dental-chart";

export function TreatmentForm({
  treatment,
  onSubmit,
  onCancel,
  patientId,
  availableMedications = []
}: {
  treatment?: Treatment,
  onSubmit: (values: any) => void,
  onCancel?: () => void,
  patientId?: number,
  availableMedications?: Medication[]
}) {
  const [date, setDate] = useState<Date | undefined>(treatment?.date ? new Date(treatment.date) : new Date());
  const [selectedMedications, setSelectedMedications] = useState<{id: number, quantity: number}[]>(
    treatment?.medications || []
  );
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>(
    treatment?.selectedTeeth || []
  );

  const { register, handleSubmit } = useForm({
    defaultValues: {
      procedure: treatment?.procedure,
      description: treatment?.description,
      cost: treatment?.cost,
      status: treatment?.status,
    },
  });

  const procedureInput = register("procedure");
  const descriptionInput = register("description");
  const costInput = register("cost");
  const statusInput = register("status");


  const handleSubmitForm = (data: any) => {
    const formValues = {
      patientId: patientId || treatment?.patientId,
      procedure: data.procedure,
      description: data.description,
      cost: parseInt(data.cost),
      status: data.status,
      date,
      medications: selectedMedications,
      selectedTeeth: selectedTeeth
    };

    onSubmit(formValues);
  };


  return (
    <form onSubmit={handleSubmit(handleSubmitForm)}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="procedure">Procédure</Label>
          <Input id="procedure" {...procedureInput} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...descriptionInput} />
        </div>
        <div>
          <Label htmlFor="cost">Coût</Label>
          <Input type="number" id="cost" {...costInput} />
        </div>
        <div>
          <Label htmlFor="status">Statut</Label>
          <select id="status" {...statusInput}>
            <option value="Planned">Planifié</option>
            <option value="InProgress">En cours</option>
            <option value="Completed">Terminé</option>
          </select>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-[160px] justify-start text-left">
                {date ? format(date, "dd/MM/yyyy") : "Sélectionner une date"}
                <CalendarIcon className="ml-auto h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar date={date} onPickDate={setDate} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Schéma dentaire */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Sélection des dents</h3>
          <DentalChart 
            selectedTeeth={selectedTeeth}
            onChange={setSelectedTeeth}
          />
        </div>

        {/* Medication Selection */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Médicaments</h3>
          {/* Add medication selection logic here */}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}