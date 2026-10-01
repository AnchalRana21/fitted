import { TailorView } from "@/components/tailor/TailorView";

export const metadata = { title: "Tailor · Fitted" };

export default async function TailorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TailorView renders its own <main> so each state (loading, not found, workspace) controls its layout.
  return <TailorView id={id} />;
}
