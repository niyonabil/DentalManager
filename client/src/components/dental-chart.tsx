import { useState } from "react";
import { cn } from "@/lib/utils";

interface DentalChartProps {
  selectedTeeth: number[];
  onChange: (selectedTeeth: number[]) => void;
  patientType: "adult" | "child";
}

export function DentalChart({ selectedTeeth, onChange, patientType }: DentalChartProps) {
  // Define tooth numbers based on patient type
  const adultTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
  ];

  const childTeeth = [
    55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
    85, 84, 83, 82, 81, 71, 72, 73, 74, 75
  ];

  const teeth = patientType === "adult" ? adultTeeth : childTeeth;

  const handleToothClick = (toothNumber: number) => {
    if (selectedTeeth.includes(toothNumber)) {
      onChange(selectedTeeth.filter(t => t !== toothNumber));
    } else {
      onChange([...selectedTeeth, toothNumber]);
    }
  };

  return (
    <div className="border rounded-md p-4">
      <div className="text-center mb-2 font-medium">
        {patientType === "adult" ? "Dentition Adulte" : "Dentition Enfant"}
      </div>
      
      {/* Upper teeth */}
      <div className="flex justify-center mb-6">
        {teeth.slice(0, teeth.length / 2).map((tooth) => (
          <div 
            key={tooth} 
            className={cn(
              "w-8 h-10 border flex flex-col items-center justify-center cursor-pointer m-1 rounded",
              selectedTeeth.includes(tooth) ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
            )}
            onClick={() => handleToothClick(tooth)}
          >
            <div className="text-xs">{tooth}</div>
            <div className="w-4 h-4 mt-1 border-2 rounded-sm"></div>
          </div>
        ))}
      </div>

      {/* Lower teeth */}
      <div className="flex justify-center">
        {teeth.slice(teeth.length / 2).map((tooth) => (
          <div 
            key={tooth} 
            className={cn(
              "w-8 h-10 border flex flex-col items-center justify-center cursor-pointer m-1 rounded",
              selectedTeeth.includes(tooth) ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
            )}
            onClick={() => handleToothClick(tooth)}
          >
            <div className="w-4 h-4 mb-1 border-2 rounded-sm"></div>
            <div className="text-xs">{tooth}</div>
          </div>
        ))}
      </div>
    </div>
  );
}