import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPatientSchema, insertAppointmentSchema, insertTreatmentSchema, insertDocumentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Patient routes
  app.get("/api/patients", async (req, res) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.get("/api/patients/:id", async (req, res) => {
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.sendStatus(404);
    res.json(patient);
  });

  app.post("/api/patients", async (req, res) => {
    const parsed = insertPatientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const patient = await storage.createPatient(parsed.data);
    res.status(201).json(patient);
  });

  app.patch("/api/patients/:id", async (req, res) => {
    const updated = await storage.updatePatient(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/patients/:id", async (req, res) => {
    await storage.deletePatient(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    const appointments = await storage.getAppointments();
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    const parsed = insertAppointmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const appointment = await storage.createAppointment(parsed.data);
    res.status(201).json(appointment);
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    const updated = await storage.updateAppointment(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    await storage.deleteAppointment(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Treatment routes
  app.get("/api/patients/:patientId/treatments", async (req, res) => {
    const treatments = await storage.getTreatments(parseInt(req.params.patientId));
    res.json(treatments);
  });

  app.post("/api/treatments", async (req, res) => {
    const parsed = insertTreatmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const treatment = await storage.createTreatment(parsed.data);
    res.status(201).json(treatment);
  });

  app.patch("/api/treatments/:id", async (req, res) => {
    const updated = await storage.updateTreatment(parseInt(req.params.id), req.body);
    res.json(updated);
  });
  
  app.delete("/api/treatments/:id", async (req, res) => {
    await storage.deleteTreatment(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Document routes
  app.get("/api/patients/:patientId/documents", async (req, res) => {
    const documents = await storage.getDocuments(parseInt(req.params.patientId));
    res.json(documents);
  });

  app.post("/api/documents", async (req, res) => {
    const parsed = insertDocumentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const document = await storage.createDocument(parsed.data);
    res.status(201).json(document);
  });

  // Medication routes
  app.get("/api/medications", async (req, res) => {
    const medications = await storage.getMedications();
    res.json(medications);
  });

  app.post("/api/medications", async (req, res) => {
    const medication = await storage.createMedication(req.body);
    res.status(201).json(medication);
  });

  app.patch("/api/medications/:id", async (req, res) => {
    const updated = await storage.updateMedication(parseInt(req.params.id), req.body);
    res.json(updated);
  });
  
  app.delete("/api/medications/:id", async (req, res) => {
    await storage.deleteMedication(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Payment routes
  app.get("/api/patients/:patientId/payments", async (req, res) => {
    const payments = await storage.getPayments(parseInt(req.params.patientId));
    res.json(payments);
  });

  app.post("/api/payments", async (req, res) => {
    const payment = await storage.createPayment(req.body);
    res.status(201).json(payment);
  });

  app.patch("/api/payments/:id", async (req, res) => {
    const updated = await storage.updatePayment(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
