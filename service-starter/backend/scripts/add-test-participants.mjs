import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(backendRoot, '..', '..');
const outputCsvPath = path.join(workspaceRoot, 'generated', 'test-share-links.csv');
const outputJsonPath = path.join(workspaceRoot, 'generated', 'test-share-links.json');

const baseUrlArg = process.argv.find((arg) => arg.startsWith('--base-url='));
const baseUrl = (baseUrlArg ? baseUrlArg.split('=')[1] : 'https://leadership-ws-st.vercel.app').replace(/\/$/, '');

const prisma = new PrismaClient();

function createToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

function toCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape).join(',')]
    .concat(rows.map((row) => headers.map((header) => escape(row[header])).join(',')))
    .join('\r\n');
}

const participants = [
  { participantId: 'TEST001', nameKo: '김테스트', teamName: '테스트전략팀', groupName: 'TEST조' },
  { participantId: 'TEST002', nameKo: '이테스트', teamName: '테스트운영팀', groupName: 'TEST조' },
  { participantId: 'TEST003', nameKo: '박테스트', teamName: '테스트기획팀', groupName: 'TEST조' },
  { participantId: 'TEST004', nameKo: '최테스트', teamName: '테스트사업팀', groupName: 'TEST조' },
  { participantId: 'TEST005', nameKo: '정테스트', teamName: '테스트혁신팀', groupName: 'TEST조' }
];

function buildAssignments(items) {
  const result = [];
  let seq = 1;
  for (const responder of items) {
    const targets = items.filter((item) => item.participantId !== responder.participantId).slice(0, 4);
    targets.forEach((target, index) => {
      result.push({
        assignmentId: `TESTA${String(seq).padStart(3, '0')}`,
        responderId: responder.participantId,
        targetId: target.participantId,
        sequenceNo: index + 1,
        groupName: responder.groupName
      });
      seq += 1;
    });
  }
  return result;
}

async function main() {
  const existingAssignments = await prisma.peerAssignment.findMany({
    where: { responderId: { in: participants.map((item) => item.participantId) } },
    orderBy: [{ responderId: 'asc' }, { sequenceNo: 'asc' }]
  });

  const peerTokenByResponder = new Map();
  for (const assignment of existingAssignments) {
    if (!peerTokenByResponder.has(assignment.responderId)) {
      peerTokenByResponder.set(assignment.responderId, assignment.peerToken);
    }
  }

  for (const participant of participants) {
    const existing = await prisma.participant.findUnique({ where: { participantId: participant.participantId } });
    await prisma.participant.upsert({
      where: { participantId: participant.participantId },
      update: {
        nameKo: participant.nameKo,
        teamName: participant.teamName,
        groupName: participant.groupName,
        isActive: true,
        selfToken: existing?.selfToken ?? createToken(),
        reportToken: existing?.reportToken ?? createToken()
      },
      create: {
        participantId: participant.participantId,
        nameKo: participant.nameKo,
        teamName: participant.teamName,
        groupName: participant.groupName,
        isActive: true,
        selfToken: createToken(),
        reportToken: createToken()
      }
    });
  }

  const assignments = buildAssignments(participants);
  for (const responder of participants) {
    if (!peerTokenByResponder.has(responder.participantId)) {
      peerTokenByResponder.set(responder.participantId, createToken());
    }
  }

  for (const assignment of assignments) {
    await prisma.peerAssignment.upsert({
      where: { assignmentId: assignment.assignmentId },
      update: {
        responderId: assignment.responderId,
        targetId: assignment.targetId,
        peerToken: peerTokenByResponder.get(assignment.responderId),
        sequenceNo: assignment.sequenceNo,
        groupName: assignment.groupName,
        isActive: true
      },
      create: {
        assignmentId: assignment.assignmentId,
        responderId: assignment.responderId,
        targetId: assignment.targetId,
        peerToken: peerTokenByResponder.get(assignment.responderId),
        sequenceNo: assignment.sequenceNo,
        groupName: assignment.groupName,
        isActive: true
      }
    });
  }

  const latestParticipants = await prisma.participant.findMany({
    where: { participantId: { in: participants.map((item) => item.participantId) } },
    orderBy: { participantId: 'asc' }
  });

  const links = latestParticipants.map((participant) => ({
    participant_id: participant.participantId,
    name_ko: participant.nameKo,
    team_name: participant.teamName,
    group_name: participant.groupName,
    self_url: `${baseUrl}/self/${participant.selfToken}`,
    peer_url: `${baseUrl}/peer/${peerTokenByResponder.get(participant.participantId)}`,
    report_url: `${baseUrl}/report/${participant.reportToken}`
  }));

  await fs.writeFile(outputCsvPath, toCsv(links), 'utf8');
  await fs.writeFile(outputJsonPath, JSON.stringify(links, null, 2), 'utf8');

  console.log(`Inserted test participants: ${links.length}`);
  console.log(`Test links CSV: ${outputCsvPath}`);
  console.log(`Test links JSON: ${outputJsonPath}`);
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