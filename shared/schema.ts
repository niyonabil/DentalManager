import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("secretary"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Patient model
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  cin: text("cin").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  medicalHistory: json("medical_history").notNull().default([]),
  documents: json("documents").notNull().default([]),
});

export const insertPatientSchema = createInsertSchema(patients)
  .omit({ id: true })
  .extend({
    dateOfBirth: z.string(),
    cin: z.string().min(1, "Numéro CIN est obligatoire"),
  });

// Appointment model
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  date: text("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  isUrgent: boolean("is_urgent").notNull().default(false),
  isPassenger: boolean("is_passenger").notNull().default(false),
});

export const insertAppointmentSchema = createInsertSchema(appointments)
  .omit({ id: true })
  .extend({
    date: z.string(),
    patientId: z.number(),
    duration: z.number(),
    status: z.string().default("scheduled"),
    notes: z.string().optional(),
    isUrgent: z.boolean().default(false),
    isPassenger: z.boolean().default(false),
  });

// Treatment model with more details
export const treatments = pgTable("treatments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  type: text("type").notNull(), // implant, prothèse, orthodontie, etc.
  description: text("description").notNull(),
  cost: integer("cost").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("completed"),
  documentId: integer("document_id"), // Lien vers la facture/devis
  notes: text("notes"),
  medications: json("medications").notNull().default([]), // Médicaments prescrits
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, partial, completed
  paidAmount: integer("paid_amount").notNull().default(0),
  selectedTeeth: json("selected_teeth").notNull().default([]),
});

export const insertTreatmentSchema = createInsertSchema(treatments)
  .omit({ id: true })
  .extend({
    medications: z.array(z.object({
      medicationId: z.number(),
      quantity: z.number(),
      instructions: z.string(),
    })),
    paymentStatus: z.enum(["pending", "partial", "completed"]).default("pending"),
    paidAmount: z.number().default(0),
    selectedTeeth: z.array(z.number()).default([]),
  });

// Payment model for tracking patient payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  treatmentId: integer("treatment_id").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // advance, full, installment
  documentId: integer("document_id"), // Lien vers la facture si paiement
  notes: text("notes"),
});

export const insertPaymentSchema = createInsertSchema(payments)
  .omit({ id: true })
  .extend({
    date: z.date(),
    type: z.enum(["advance", "full", "installment"]),
    notes: z.string().optional(),
  });



// Medication/Stock model
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  currentStock: integer("current_stock").notNull(),
  minimumStock: integer("minimum_stock").notNull(),
  unit: text("unit").notNull(), // comprimé, ml, etc.
  price: integer("price"),
  supplier: text("supplier"),
  lastRestockDate: timestamp("last_restock_date"),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
});

// Stock Movement model
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull(),
  quantity: integer("quantity").notNull(), // positive for in, negative for out
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // "in" or "out"
  reason: text("reason"), // "treatment", "expired", "restock"
  treatmentId: integer("treatment_id"), // if movement is related to a treatment
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
});

// Document model for invoices, quotes etc.
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  type: text("type").notNull(), // invoice, quote, note_honoraire
  number: text("number"), // FAC-2025-001, DEV-2025-001
  data: json("data").notNull(),
  date: timestamp("date").notNull(),
  documentNumber: text("document_number"), // Numéro de document
  notes: text("notes"), // Notes additionnelles
  items: json("items").notNull().default([]), // Liste des soins/traitements inclus
  total: integer("total").notNull(),
  status: text("status").notNull().default("draft"), // draft, final
  payments: json("payments").notNull().default([]), // Liste des paiements associés
});

export const insertDocumentSchema = createInsertSchema(documents)
  .omit({ id: true })
  .extend({
    items: z.array(z.object({
      treatmentId: z.number(),
      description: z.string(),
      cost: z.number(),
    })),
  });

// Settings model
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull().default("EUR"),
  currencySymbol: text("currency_symbol").notNull().default("€"),
  documentPrefix: json("document_prefix").notNull().default({
    invoice: "FAC",
    quote: "DEV"
  }),
  companyInfo: json("company_info").notNull().default({
    name: "",
    address: "",
    phone: "",
    email: ""
  }),
});



// Statistics views
export const financialStats = pgTable("financial_stats", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalRevenue: integer("total_revenue").notNull().default(0),
  treatmentCount: integer("treatment_count").notNull().default(0),
  patientCount: integer("patient_count").notNull().default(0),
  commonTreatments: json("common_treatments").notNull().default([]),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Treatment = typeof treatments.$inferSelect;
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type FinancialStat = typeof financialStats.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;