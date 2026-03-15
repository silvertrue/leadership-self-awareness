import { DIMENSION_META } from "../lib/dimension-meta";

export default function DimensionGuide({ title }: { title: string }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <p className="muted">리더십 3영역과 6개 Dimension 설명입니다. 자가진단과 Peer 피드백을 작성할 때 아래 기준을 참고해 주세요.</p>
      <div className="dimension-guide" style={{ marginTop: 16 }}>
        {DIMENSION_META.map((item) => (
          <div className={`dimension-item ${item.groupKey}`} key={item.name}>
            <div className="dimension-head">
              <div className={`dimension-group ${item.groupKey}`}>{item.group}</div>
              <div>
                <div className="dimension-name">{item.name}</div>
                <div className="dimension-tags">{item.hashtags}</div>
              </div>
            </div>
            <div className="dimension-body">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
