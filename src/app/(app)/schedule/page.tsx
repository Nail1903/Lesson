import { requireUser } from "@/lib/auth";
import { getPlannerData } from "@/server/services/planner-service";
import { WeeklyPlanner } from "@/components/planner/weekly-planner";

export const metadata = { title: "Tədris Planlayıcısı" };

export default async function SchedulePage() {
  const user = await requireUser();
  const { universities, subjects, classes } = await getPlannerData(user.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tədris Planlayıcısı</h1>
        <p className="text-sm text-muted-foreground">
          Tədris etdiyin fənlərin həftəlik cədvəli. Fənnin üstünə klikləyib məzmununu (dərslər, terminlər) aç.
        </p>
      </div>
      <WeeklyPlanner
        universities={universities}
        subjects={subjects}
        classes={classes.map((c) => ({
          id: c.id,
          weekday: c.weekday,
          startTime: c.startTime,
          endTime: c.endTime,
          groupLabel: c.groupLabel,
          room: c.room,
          color: c.color,
          subject: c.subject,
          university: c.university,
        }))}
      />
    </div>
  );
}
