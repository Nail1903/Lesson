import { redirect } from "next/navigation";

export default async function ProgramRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { slug } = await params;
  const { v } = await searchParams;
  redirect(`/subjects/${slug}?tab=program${v ? `&v=${v}` : ""}`);
}
