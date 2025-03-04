import { users, patients, appointments, treatments, documents } from "@shared/schema";
import type { User, InsertUser, Patient, InsertPatient, Appointment, InsertAppointment, Treatment, InsertTreatment, Document, InsertDocument } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

interface Medication {
  id: number;
  name: string;
  dosage: string;
  patientId: number;
  lastRestockDate: Date | null;
}

interface InsertMedication {
  name: string;
  dosage: string;
  patientId: number;
  lastRestockDate?: string | Date | null;
}


interface Payment {
  id: number;
  patientId: number;
  amount: number;
  date: Date;
  method: string;
}


interface Settings {
  id: number;
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


export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Patient operations
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<Patient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  // Treatment operations
  getTreatments(patientId: number): Promise<Treatment[]>;
  createTreatment(treatment: InsertTreatment): Promise<Treatment>;
  updateTreatment(id: number, treatment: Partial<Treatment>): Promise<Treatment>;

  // Document operations
  getDocuments(patientId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  //Medication operations
  getMedications(): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<Medication>): Promise<Medication>;

  // Payment operations
  getPayments(patientId: number): Promise<Payment[]>;
  createPayment(payment: any): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment>;

  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<Settings>): Promise<Settings>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private appointments: Map<number, Appointment>;
  private treatments: Map<number, Treatment>;
  private documents: Map<number, Document>;
  sessionStore: session.SessionStore;

  private currentIds: {
    user: number;
    patient: number;
    appointment: number;
    treatment: number;
    document: number;
  };

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.appointments = new Map();
    this.treatments = new Map();
    this.documents = new Map();

    this.currentIds = {
      user: 1,
      patient: 1,
      appointment: 1,
      treatment: 1,
      document: 1
    };

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentIds.patient++;
    const patient: Patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, patientUpdate: Partial<Patient>): Promise<Patient> {
    const existing = await this.getPatient(id);
    if (!existing) throw new Error("Patient not found");

    const updated = { ...existing, ...patientUpdate };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: number): Promise<void> {
    this.patients.delete(id);
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentIds.appointment++;
    const appointment: Appointment = { ...insertAppointment, id };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<Appointment>): Promise<Appointment> {
    const existing = await this.getAppointment(id);
    if (!existing) throw new Error("Appointment not found");

    const updated = { ...existing, ...appointmentUpdate };
    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: number): Promise<void> {
    this.appointments.delete(id);
  }

  // Treatment operations
  async getTreatments(patientId: number): Promise<Treatment[]> {
    return Array.from(this.treatments.values()).filter(t => t.patientId === patientId);
  }

  async createTreatment(insertTreatment: InsertTreatment): Promise<Treatment> {
    const id = this.currentIds.treatment++;
    const treatment: Treatment = { ...insertTreatment, id };
    this.treatments.set(id, treatment);
    return treatment;
  }

  async updateTreatment(id: number, treatmentUpdate: Partial<Treatment>): Promise<Treatment> {
    const existing = this.treatments.get(id);
    if (!existing) throw new Error("Treatment not found");

    const updated = { ...existing, ...treatmentUpdate };
    this.treatments.set(id, updated);
    return updated;
  }

  // Document operations
  async getDocuments(patientId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.patientId === patientId);
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const documents = await this.getDocuments(data.patientId);
    const newDocument: Document = {
      id: documents.length ? Math.max(...documents.map(d => d.id)) + 1 : 1,
      ...data,
    };
    this.documents.set(`${newDocument.patientId}:${newDocument.id}`, newDocument);
    return newDocument;
  }

  // Medication methods
  private medications = new Map<number, Medication>();

  async getMedications(): Promise<Medication[]> {
    return Array.from(this.medications.values());
  }

  async createMedication(data: InsertMedication): Promise<Medication> {
    const medications = await this.getMedications();
    const newMedication: Medication = {
      id: medications.length ? Math.max(...medications.map(m => m.id)) + 1 : 1,
      ...data,
      lastRestockDate: data.lastRestockDate ? new Date(data.lastRestockDate) : null,
    };
    this.medications.set(newMedication.id, newMedication);
    return newMedication;
  }

  async updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
    const medication = this.medications.get(id);
    if (!medication) throw new Error("Medication not found");

    const updated = { ...medication, ...data };
    this.medications.set(id, updated);
    return updated;
  }

  // Payment methods
  private payments = new Map<string, Payment>();

  async getPayments(patientId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.patientId === patientId);
  }

  async createPayment(data: any): Promise<Payment> {
    const payments = Array.from(this.payments.values());
    const newPayment: Payment = {
      id: payments.length ? Math.max(...payments.map(p => p.id)) + 1 : 1,
      ...data,
      date: data.date instanceof Date ? data.date : new Date(data.date),
    };
    this.payments.set(`${newPayment.patientId}:${newPayment.id}`, newPayment);
    return newPayment;
  }

  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment> {
    const payment = Array.from(this.payments.values()).find(p => p.id === id);
    if (!payment) throw new Error("Payment not found");

    const updated = { ...payment, ...data };
    this.payments.set(`${updated.patientId}:${updated.id}`, updated);
    return updated;
  }

  // Settings methods
  private settingsData: Settings | null = null;

  async getSettings(): Promise<Settings> {
    if (!this.settingsData) {
      this.settingsData = {
        id: 1,
        currency: "EUR",
        currencySymbol: "€",
        documentPrefix: {
          invoice: "FAC",
          quote: "DEV"
        },
        companyInfo: {
          name: "",
          address: "",
          phone: "",
          email: ""
        }
      };
    }
    return this.settingsData;
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    // Assurez-vous que les données sont valides avant de les stocker
    try {
      const updatedSettings = {
        ...currentSettings,
        ...data,
        companyInfo: {
          ...currentSettings.companyInfo,
          ...(data.companyInfo || {})
        },
        documentPrefix: {
          ...currentSettings.documentPrefix,
          ...(data.documentPrefix || {})
        }
      };
      this.settingsData = updatedSettings;
      return updatedSettings;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw new Error("Invalid settings data");
    }
  }
}

export const storage = new MemStorage();