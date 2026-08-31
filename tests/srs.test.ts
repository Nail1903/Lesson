import { describe, it, expect } from "vitest";
import { schedule, INITIAL_SRS, overdueScore } from "@/lib/srs";

describe("SM-2 scheduler", () => {
  it("first successful review schedules 1 day out", () => {
    const r = schedule(INITIAL_SRS, "GOOD");
    expect(r.repetition).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.dueAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("second successful review schedules 6 days out", () => {
    const r1 = schedule(INITIAL_SRS, "GOOD");
    const r2 = schedule(r1, "GOOD");
    expect(r2.repetition).toBe(2);
    expect(r2.intervalDays).toBe(6);
  });

  it("FORGOT resets repetition and increments lapses", () => {
    const r1 = schedule(INITIAL_SRS, "GOOD");
    const r2 = schedule(r1, "GOOD");
    const r3 = schedule(r2, "FORGOT");
    expect(r3.repetition).toBe(0);
    expect(r3.intervalDays).toBe(1);
    expect(r3.lapses).toBe(1);
  });

  it("ease factor never drops below 1.3", () => {
    let s = INITIAL_SRS;
    for (let i = 0; i < 10; i++) s = schedule(s, "HARD");
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("mastery requires several successful long-interval reviews", () => {
    let s = INITIAL_SRS;
    let last = schedule(s, "EASY");
    for (let i = 0; i < 5; i++) last = schedule(last, "EASY");
    expect(last.intervalDays).toBeGreaterThanOrEqual(21);
    expect(last.mastered).toBe(true);
  });

  it("overdueScore rises with importance and lateness", () => {
    const old = new Date(Date.now() - 5 * 864e5);
    expect(overdueScore(old, 5)).toBeGreaterThan(overdueScore(old, 1));
  });
});
