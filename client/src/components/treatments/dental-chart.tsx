
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DentalChartProps {
  selectedTeeth: number[];
  onChange: (selectedTeeth: number[]) => void;
}

export function DentalChart({ selectedTeeth = [], onChange }: DentalChartProps) {
  // Création des numéros de dents selon la notation universelle (1-32 pour adultes)
  const adultTeeth = Array.from({ length: 32 }, (_, i) => i + 1);
  
  const toggleTooth = (toothNumber: number) => {
    if (selectedTeeth.includes(toothNumber)) {
      onChange(selectedTeeth.filter(num => num !== toothNumber));
    } else {
      onChange([...selectedTeeth, toothNumber]);
    }
  };

  const isSelected = (toothNumber: number) => {
    return selectedTeeth.includes(toothNumber);
  };
  
  return (
    <div className="w-full p-4 border rounded-lg">
      <h3 className="font-semibold mb-4 text-center">Schéma dentaire</h3>
      
      <div className="flex flex-wrap justify-center gap-1 mb-4">
        {/* Rangée supérieure - dents 1-16 */}
        <div className="flex flex-wrap justify-center w-full mb-4">
          {adultTeeth.slice(0, 16).map((toothNumber) => (
            <Button
              key={`top-${toothNumber}`}
              type="button"
              variant={isSelected(toothNumber) ? "default" : "outline"}
              className={`w-10 h-10 m-1 ${isSelected(toothNumber) ? 'bg-blue-500' : ''}`}
              onClick={() => toggleTooth(toothNumber)}
            >
              {toothNumber}
            </Button>
          ))}
        </div>
        
        {/* Rangée inférieure - dents 17-32 */}
        <div className="flex flex-wrap justify-center w-full">
          {adultTeeth.slice(16, 32).map((toothNumber) => (
            <Button
              key={`bottom-${toothNumber}`}
              type="button"
              variant={isSelected(toothNumber) ? "default" : "outline"}
              className={`w-10 h-10 m-1 ${isSelected(toothNumber) ? 'bg-blue-500' : ''}`}
              onClick={() => toggleTooth(toothNumber)}
            >
              {toothNumber}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">Dents sélectionnées:</p>
        <div className="flex flex-wrap gap-1">
          {selectedTeeth.length > 0 ? (
            selectedTeeth.sort((a, b) => a - b).map(tooth => (
              <span key={tooth} className="px-2 py-1 bg-blue-100 rounded text-sm">
                {tooth}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">Aucune dent sélectionnée</span>
          )}
        </div>
      </div>
    </div>
  );
}
