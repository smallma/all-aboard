import { EditorPage } from '@/components/editor/EditorPage';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanEditorRoute({ params }: PageProps) {
  const { id } = await params;
  return <EditorPage planId={id} />;
}
