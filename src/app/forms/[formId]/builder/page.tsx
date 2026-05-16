import { BuilderPage } from "@/features/builder/BuilderPage";

export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return <BuilderPage formId={formId} />;
}
