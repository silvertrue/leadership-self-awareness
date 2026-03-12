import PeerSurveyClient from '@/src/components/PeerSurveyClient';

export default async function PeerSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PeerSurveyClient token={token} />;
}