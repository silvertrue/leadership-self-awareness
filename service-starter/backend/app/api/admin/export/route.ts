import { createContainer } from '@/src/lib/container';
import { requireAdminSession } from '@/src/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const container = createContainer();

    const [participants, assignments, selfResponses, peerResponses, responderSubmissions, reportRuns] = await Promise.all([
      container.repositories.participantRepository.listAll(),
      container.repositories.assignmentRepository.listAll(),
      container.repositories.selfResponseRepository.listAll(),
      container.repositories.peerResponseRepository.listAll(),
      container.repositories.peerResponseRepository.listResponderSubmissions(),
      container.repositories.reportRunRepository.listAll()
    ]);

    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const backup = {
      exportedAt: now.toISOString(),
      counts: {
        participants: participants.length,
        assignments: assignments.length,
        selfResponses: selfResponses.length,
        peerResponses: peerResponses.length,
        responderSubmissions: responderSubmissions.length,
        reportRuns: reportRuns.length
      },
      participants,
      assignments,
      selfResponses,
      peerResponses,
      responderSubmissions,
      reportRuns
    };

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="self-awareness-backup-${stamp}.json"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ ok: false, error: message }, { status: 401 });
  }
}