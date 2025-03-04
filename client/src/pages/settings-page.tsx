import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SystemSettings>({
    defaultValues: settings || {
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
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      try {
        // Assurez-vous que les données sont correctement formatées
        const sanitizedSettings = JSON.parse(JSON.stringify(settings));
        const res = await apiRequest("POST", "/api/settings", sanitizedSettings);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to update settings");
        }
        return await res.json();
      } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Succès",
        description: "Paramètres mis à jour",
      });
      form.reset(form.getValues());
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les paramètres",
        variant: "destructive"
      });
    }
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Paramètres du système</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateSettingsMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devise</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currencySymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbole monétaire</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentPrefix.invoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préfixe Factures</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentPrefix.quote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préfixe Devis</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations du cabinet</h3>

                <FormField
                  control={form.control}
                  name="companyInfo.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du cabinet</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyInfo.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateSettingsMutation.isPending}>
                Enregistrer les paramètres
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}