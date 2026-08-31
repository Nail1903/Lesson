import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Qeydiyyat" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni hesab yarat</CardTitle>
        <CardDescription>Hesabın hazır olduqda başlanğıc terminlər avtomatik əlavə olunacaq.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Artıq hesabın var?{" "}
          <Link href="/login" className="text-primary underline underline-offset-2">
            Daxil ol
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
