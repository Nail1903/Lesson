import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat HH:MM formatında");

export const plannerUniversitySchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(2, "Universitetin adı vacibdir").max(200),
  shortName: z.string().trim().max(40).optional().or(z.literal("")),
  logoEmoji: z.string().trim().max(8).optional().or(z.literal("")),
});

export const plannerSubjectSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, "Fənnin adı vacibdir").max(200),
  universityId: z.string().cuid().optional().nullable(),
});

export const weeklyClassSchema = z.object({
  id: z.string().cuid().optional(),
  subjectId: z.string().cuid().optional(),
  newSubjectName: z.string().trim().min(1).max(200).optional(),
  universityId: z.string().cuid().optional().nullable(),
  weekday: z.coerce.number().int().min(1).max(7),
  startTime: time,
  endTime: time,
  groupLabel: z.string().trim().max(60).optional().or(z.literal("")),
  room: z.string().trim().max(80).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/)
    .optional()
    .or(z.literal("")),
});

export type WeeklyClassInput = z.infer<typeof weeklyClassSchema>;
