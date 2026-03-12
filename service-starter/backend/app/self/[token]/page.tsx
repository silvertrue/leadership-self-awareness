import WorkspaceClient from '@/src/components/WorkspaceClient';

export default async function SelfSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <WorkspaceClient token={token} />;
}