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
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true
});

// Treatment model
export const treatments = pgTable("treatments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  cost: integer("cost").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertTreatmentSchema = createInsertSchema(treatments).omit({
  id: true
});

// Document model for invoices, quotes etc.
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  type: text("type").notNull(), // invoice, quote, note_honoraire
  data: json("data").notNull(),
  date: timestamp("date").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true
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

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;