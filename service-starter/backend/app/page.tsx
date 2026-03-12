const items = [
  '/api/public/self/sample-token',
  '/api/public/peer/sample-token',
  '/api/public/report/sample-token',
  '/api/admin/dashboard'
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 40, lineHeight: 1.1 }}>Self Awareness Backend Starter</h1>
      <p style={{ margin: '0 0 24px', color: '#4c5d74', lineHeight: 1.7 }}>
        Next.js App Router + Prisma 기준의 백엔드 스타터입니다. 현재는 설문/리포트 API 구조와 서비스 계층이 연결된 상태이며,
        실제 실행을 위해서는 의존성 설치와 DB 연결이 필요합니다.
      </p>
      <ul style={{ lineHeight: 2 }}>
        {items.map((item) => (
          <li key={item}>
            <code>{item}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
