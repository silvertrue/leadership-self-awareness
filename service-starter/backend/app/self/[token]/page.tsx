import SelfSurveyClient from '@/src/components/SelfSurveyClient';

export default async function SelfSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SelfSurveyClient token={token} />;
}