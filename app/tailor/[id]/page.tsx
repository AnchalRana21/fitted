import { TailorView } from "@/components/tailor/TailorView";

export default async function TailorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TailorView id={id} />;
}
