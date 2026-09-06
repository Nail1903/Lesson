import { redirect } from "next/navigation";

/** "Təkrar rejimi" birləşdi → "Öyrənmə seansı". Köhnə linklər üçün yönləndirmə. */
export default function ReviewRedirect() {
  redirect("/learn");
}
