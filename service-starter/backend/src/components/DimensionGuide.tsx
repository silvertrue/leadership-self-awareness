import { DIMENSION_META } from '../lib/dimension-meta';

export default function DimensionGuide({ title }: { title: string }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <p className="muted">6개 Dimension을 경험, 역량, 자질의 세 관점에서 이해한 뒤 선택하면 판단 근거를 더 선명하게 적을 수 있습니다.</p>
      <div className="dimension-guide" style={{ marginTop: 16 }}>
        {DIMENSION_META.map((item) => (
          <div className="dimension-item" key={item.name}>
            <div className="dimension-head">
              <div className="dimension-group">{item.group}</div>
              <div className="dimension-name">{item.name}</div>
            </div>
            <div className="dimension-body">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}