
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SystemSettings {
  currency: string;
  currencySymbol: string;
  documentPrefix: {
    invoice: string;
    quote: string;
  };
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function useSettings() {
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      return response.json();
    },
  });

  return {
    settings: settings || {
      currency: "EUR",
      currencySymbol: "€",
      documentPrefix: {
        invoice: "FAC",
        quote: "DEV",
      },
      companyInfo: {
        name: "",
        address: "",
        phone: "",
        email: "",
      },
    },
    isLoading,
  };
}
