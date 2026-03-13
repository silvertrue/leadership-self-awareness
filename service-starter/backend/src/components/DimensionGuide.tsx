import { DIMENSION_META } from "../lib/dimension-meta";

export default function DimensionGuide({ title }: { title: string }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <p className="muted">아래 설명은 리더십 3영역 - 6Dimension에 대한 기준 설명입니다.</p>
      <div className="dimension-guide" style={{ marginTop: 16 }}>
        {DIMENSION_META.map((item) => (
          <div className="dimension-item" key={item.name}>
            <div className="dimension-head">
              <div className="dimension-group">{item.group}</div>
              <div>
                <div className="dimension-name">{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5a6d84", marginTop: 4 }}>{item.hashtags}</div>
              </div>
            </div>
            <div className="dimension-body">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
