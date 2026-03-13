import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import nodemailer from "nodemailer";

const backendRoot = process.cwd();
const projectRoot = path.resolve(backendRoot, "..", "..");
const envPath = path.join(backendRoot, ".env");
const linksPath = path.join(projectRoot, "generated", "test-share-links.csv");
const previewPath = path.join(projectRoot, "generated", "test-email-preview.md");

const recipients = [
  { participantId: "TEST001", name: "김테스트", email: "eunjinlee@sk.com" },
  { participantId: "TEST002", name: "이테스트", email: "jiwon@sk.com" },
  { participantId: "TEST003", name: "박테스트", email: "heejunk@sk.com" },
  { participantId: "TEST004", name: "최테스트", email: "kangschoi@sk.com" },
  { participantId: "TEST005", name: "정테스트", email: "jeehyun.lisa.hwang@sk.com" },
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function loadLinks(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`링크 파일을 찾을 수 없습니다: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return rows;
}

function buildMailContent(name, url) {
  const subject = "[TEST] 팀장 자기인식 진단 사이트 접속 안내";
  const text = [
    `${name}님 안녕하세요.`,
    "",
    "팀장 자기인식 진단 사이트 테스트를 위해 아래 링크를 전달드립니다.",
    "이번 테스트에서는 링크 1개로 자가진단과 Peer 피드백까지 모두 확인하실 수 있습니다.",
    "",
    `[개인 접속 링크]`,
    url,
    "",
    `[테스트 요청 사항]`,
    "1. 링크 접속 후 자가진단 화면을 확인해 주세요.",
    "2. 이어서 Peer 피드백 화면까지 이동이 자연스러운지 확인해 주세요.",
    "3. 입력/저장/제출 과정에서 어색한 점이 있으면 회신 부탁드립니다.",
    "",
    "테스트용 링크이므로 편하게 확인해 주시면 됩니다.",
    "감사합니다.",
    "",
    "SK Enmove HR",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, 'Noto Sans KR', sans-serif; color: #1f2937; line-height: 1.7;">
      <p>${name}님 안녕하세요.</p>
      <p>팀장 자기인식 진단 사이트 테스트를 위해 아래 링크를 전달드립니다.<br/>이번 테스트에서는 링크 1개로 자가진단과 Peer 피드백까지 모두 확인하실 수 있습니다.</p>
      <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <div style="font-weight: 700; margin-bottom: 8px;">개인 접속 링크</div>
        <a href="${url}" style="color: #ea580c; word-break: break-all;">${url}</a>
      </div>
      <div style="margin: 20px 0; padding: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;">
        <div style="font-weight: 700; margin-bottom: 8px;">테스트 요청 사항</div>
        <ol style="margin: 0; padding-left: 18px;">
          <li>링크 접속 후 자가진단 화면을 확인해 주세요.</li>
          <li>이어서 Peer 피드백 화면까지 이동이 자연스러운지 확인해 주세요.</li>
          <li>입력/저장/제출 과정에서 어색한 점이 있으면 회신 부탁드립니다.</li>
        </ol>
      </div>
      <p>테스트용 링크이므로 편하게 확인해 주시면 됩니다.<br/>감사합니다.</p>
      <p>SK Enmove HR</p>
    </div>
  `.trim();

  return { subject, text, html };
}

function createPreview(entries) {
  const sections = entries.map((entry) => {
    const { subject, text } = buildMailContent(entry.name, entry.selfUrl);
    return [
      `## ${entry.name} <${entry.email}>`,
      "",
      `- 링크: ${entry.selfUrl}`,
      `- 제목: ${subject}`,
      "",
      "```text",
      text,
      "```",
    ].join("\n");
  });

  const output = [
    "# 테스트 메일 미리보기",
    "",
    `생성시각: ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
    "",
    ...sections,
    "",
  ].join("\n");

  fs.writeFileSync(previewPath, output, "utf8");
}

function getArgValue(flag) {
  const index = process.argv.findIndex((argument) => argument === flag);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] ?? null;
}

async function main() {
  parseEnvFile(envPath);

  const dryRun = process.argv.includes("--dry-run");
  const onlyName = getArgValue("--only");
  const rows = loadLinks(linksPath);
  const rowMap = new Map(rows.map((row) => [row.participant_id, row]));

  const entries = recipients
    .filter((recipient) => !onlyName || recipient.name === onlyName)
    .map((recipient) => {
      const row = rowMap.get(recipient.participantId);
      if (!row?.self_url) {
        throw new Error(`${recipient.name}(${recipient.participantId}) 링크를 찾을 수 없습니다.`);
      }

      return {
        ...recipient,
        selfUrl: row.self_url,
      };
    });

  createPreview(entries);

  if (dryRun) {
    console.log(`미리보기 파일 생성: ${previewPath}`);
    console.log(`대상자 수: ${entries.length}`);
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const fromName = process.env.MAIL_FROM_NAME || "SK Enmove HR";
  const replyTo = process.env.MAIL_REPLY_TO || undefined;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER 와 GMAIL_APP_PASSWORD 를 .env 또는 환경변수에 설정해 주세요.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  for (const entry of entries) {
    const { subject, text, html } = buildMailContent(entry.name, entry.selfUrl);
    await transporter.sendMail({
      from: `${fromName} <${gmailUser}>`,
      to: entry.email,
      replyTo,
      subject,
      text,
      html,
    });

    console.log(`발송 완료: ${entry.name} <${entry.email}>`);
  }

  console.log(`총 ${entries.length}명 발송 완료`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
