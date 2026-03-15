import { createContainer } from '@/src/lib/container';
import { requireAdminSession } from '@/src/lib/auth';

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

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

    const url = new URL(request.url);
    const exportType = url.searchParams.get('type');

    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    if (exportType === 'self-responses-csv') {
      const participantMap = new Map(participants.map((participant) => [participant.participantId, participant]));
      const headers = [
        'participant_id',
        'name_ko',
        'team_name',
        'group_name',
        'transport_mode',
        'vehicle_number',
        'laptop_bring_option',
        'laptop_os',
        'strength1',
        'strength1_comment',
        'strength2',
        'strength2_comment',
        'growth1',
        'growth1_comment',
        'growth2',
        'growth2_comment',
        'test_question_answer',
        'status',
        'submitted_at',
        'updated_at'
      ];

      const rows = selfResponses.map((response) => {
        const participant = participantMap.get(response.participantId);
        return [
          response.participantId,
          participant?.nameKo ?? '',
          participant?.teamName ?? '',
          participant?.groupName ?? '',
          response.transportMode ?? '',
          response.vehicleNumber ?? '',
          response.laptopBringOption ?? '',
          response.laptopOs ?? '',
          response.strength1 ?? '',
          response.strength1Comment ?? '',
          response.strength2 ?? '',
          response.strength2Comment ?? '',
          response.growth1 ?? '',
          response.growth1Comment ?? '',
          response.growth2 ?? '',
          response.growth2Comment ?? '',
          response.testQuestionAnswer ?? '',
          response.status ?? '',
          response.submittedAt ?? '',
          response.updatedAt ?? ''
        ].map(csvEscape).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="self-awareness-self-responses-${stamp}.csv"`
        }
      });
    }

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
