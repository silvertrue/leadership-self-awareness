import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(backendRoot, '..', '..');
const participantsCsvPath = path.join(workspaceRoot, 'generated', 'participants-import.csv');
const assignmentsCsvPath = path.join(workspaceRoot, 'generated', 'peer-assignments-generated.csv');
const linksOutputPath = path.join(workspaceRoot, 'generated', 'share-links.csv');
const linksJsonPath = path.join(workspaceRoot, 'generated', 'share-links.json');

const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const baseUrl = (baseUrlArg ? baseUrlArg.split('=')[1] : 'http://localhost:3000').replace(/\/$/, '');

const prisma = new PrismaClient();

function createToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

function parseCsv(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      current = '';
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  if (rows.length === 0) return [];
  const [rawHeader, ...body] = rows;
  const header = rawHeader.map((key) => String(key ?? '').replace(/^\uFEFF/, '').trim());
  return body.map((cells) =>
    header.reduce((acc, key, index) => {
      acc[key] = String(cells[index] ?? '').trim();
      return acc;
    }, {})
  );
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(',')]
    .concat(rows.map((row) => headers.map((header) => escape(row[header])).join(',')))
    .join('\r\n');
}

async function main() {
  const [participantsCsv, assignmentsCsv, existingParticipants, existingAssignments] = await Promise.all([
    fs.readFile(participantsCsvPath, 'utf8'),
    fs.readFile(assignmentsCsvPath, 'utf8'),
    prisma.participant.findMany(),
    prisma.peerAssignment.findMany({ orderBy: [{ responderId: 'asc' }, { sequenceNo: 'asc' }] })
  ]);

  const participants = parseCsv(participantsCsv);
  const assignments = parseCsv(assignmentsCsv);

  const participantTokenMap = new Map(
    existingParticipants.map((participant) => [
      participant.participantId,
      {
        selfToken: participant.selfToken || createToken(),
        reportToken: participant.reportToken || createToken()
      }
    ])
  );

  const responderPeerTokenMap = new Map();
  for (const assignment of existingAssignments) {
    if (!responderPeerTokenMap.has(assignment.responderId)) {
      responderPeerTokenMap.set(assignment.responderId, assignment.peerToken);
    }
  }

  for (const participant of participants) {
    if (!participantTokenMap.has(participant.participant_id)) {
      participantTokenMap.set(participant.participant_id, {
        selfToken: createToken(),
        reportToken: createToken()
      });
    }
  }

  for (const assignment of assignments) {
    if (!responderPeerTokenMap.has(assignment.responder_id)) {
      responderPeerTokenMap.set(assignment.responder_id, createToken());
    }
  }

  for (const participant of participants) {
    const tokens = participantTokenMap.get(participant.participant_id);
    await prisma.participant.upsert({
      where: { participantId: participant.participant_id },
      update: {
        nameKo: participant.name_ko,
        teamName: participant.team_name,
        groupName: participant.group_name,
        email: null,
        selfToken: tokens.selfToken,
        reportToken: tokens.reportToken,
        isActive: true
      },
      create: {
        participantId: participant.participant_id,
        nameKo: participant.name_ko,
        teamName: participant.team_name,
        groupName: participant.group_name,
        email: null,
        selfToken: tokens.selfToken,
        reportToken: tokens.reportToken,
        isActive: true
      }
    });
  }

  const sequenceByResponder = new Map();
  for (const assignment of assignments) {
    const currentSequence = (sequenceByResponder.get(assignment.responder_id) || 0) + 1;
    sequenceByResponder.set(assignment.responder_id, currentSequence);

    await prisma.peerAssignment.upsert({
      where: { assignmentId: assignment.assignment_id },
      update: {
        responderId: assignment.responder_id,
        targetId: assignment.target_id,
        peerToken: responderPeerTokenMap.get(assignment.responder_id),
        sequenceNo: currentSequence,
        groupName: assignment.group_name,
        isActive: assignment.active_yn !== 'N'
      },
      create: {
        assignmentId: assignment.assignment_id,
        responderId: assignment.responder_id,
        targetId: assignment.target_id,
        peerToken: responderPeerTokenMap.get(assignment.responder_id),
        sequenceNo: currentSequence,
        groupName: assignment.group_name,
        isActive: assignment.active_yn !== 'N'
      }
    });
  }

  const links = participants.map((participant) => {
    const tokens = participantTokenMap.get(participant.participant_id);
    const peerToken = responderPeerTokenMap.get(participant.participant_id) || '';
    return {
      participant_id: participant.participant_id,
      name_ko: participant.name_ko,
      team_name: participant.team_name,
      group_name: participant.group_name,
      self_url: `${baseUrl}/self/${tokens.selfToken}`,
      peer_url: peerToken ? `${baseUrl}/peer/${peerToken}` : '',
      report_url: `${baseUrl}/report/${tokens.reportToken}`
    };
  });

  await fs.writeFile(linksOutputPath, toCsv(links), 'utf8');
  await fs.writeFile(linksJsonPath, JSON.stringify(links, null, 2), 'utf8');

  console.log(`Imported participants: ${participants.length}`);
  console.log(`Imported peer assignments: ${assignments.length}`);
  console.log(`Share links CSV: ${linksOutputPath}`);
  console.log(`Share links JSON: ${linksJsonPath}`);
  console.log(`Base URL used: ${baseUrl}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });