import { TailorView } from "@/components/tailor/TailorView";

export const metadata = { title: "Tailor · Fitted" };

export default async function TailorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <TailorView id={id} />
    </main>
  );
}
