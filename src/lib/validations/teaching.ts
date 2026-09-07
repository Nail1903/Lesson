import { z } from "zod";

export const universitySchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(2).max(200),
  shortName: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  academicHourMinutes: z.coerce.number().int().min(20).max(120).default(45),
});

export const facultySchema = z.object({
  id: z.string().cuid().optional(),
  universityId: z.string().cuid(),
  name: z.string().trim().min(2).max(200),
  department: z.string().trim().max(200).optional().or(z.literal("")),
});

export const groupSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(80),
  universityId: z.string().cuid().optional().nullable(),
  studentCount: z.coerce.number().int().min(0).max(2000).optional().nullable(),
  specialty: z.string().trim().max(200).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(400).optional().or(z.literal("")),
});

export const offeringSchema = z.object({
  id: z.string().cuid().optional(),
  subjectId: z.string().cuid(),
  universityId: z.string().cuid(),
  facultyId: z.string().cuid().optional().nullable(),
  academicYear: z.string().trim().regex(/^\d{4}\/\d{4}$/, "Format: 2025/2026"),
  term: z.enum(["Payız", "Yaz", "Yay"]),
  language: z.string().trim().max(8).default("az"),
  format: z.string().trim().max(120).optional().or(z.literal("")),
  teacherName: z.string().trim().max(200).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(400).optional().or(z.literal("")),
  consultationHours: z.string().trim().max(200).optional().or(z.literal("")),
  creditHours: z.coerce.number().min(0).max(60).optional().nullable(),
  lectureHours: z.coerce.number().int().min(0).max(500).optional().nullable(),
  seminarHours: z.coerce.number().int().min(0).max(500).optional().nullable(),
  labHours: z.coerce.number().int().min(0).max(500).optional().nullable(),
  practiceHours: z.coerce.number().int().min(0).max(500).optional().nullable(),
  selfStudyHours: z.coerce.number().int().min(0).max(1000).optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  groupIds: z.array(z.string().cuid()).max(20).default([]),
});

export const cloneOfferingSchema = z.object({
  offeringId: z.string().cuid(),
  academicYear: z.string().trim().regex(/^\d{4}\/\d{4}$/, "Format: 2026/2027"),
  term: z.enum(["Payız", "Yaz", "Yay"]),
  groupIds: z.array(z.string().cuid()).max(20).default([]),
  keepCourseVersion: z.boolean().default(true),
});

export const groupProgressSchema = z.object({
  offeringId: z.string().cuid(),
  groupId: z.string().cuid(),
  lastLessonId: z.string().cuid().optional().nullable(),
  note: z.string().trim().max(4000).optional().or(z.literal("")),
  nextStep: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type UniversityInput = z.infer<typeof universitySchema>;
export type OfferingInput = z.infer<typeof offeringSchema>;
