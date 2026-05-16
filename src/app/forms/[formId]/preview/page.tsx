import { PreviewPage } from "@/features/preview/PreviewPage";

export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return <PreviewPage formId={formId} />;
}
