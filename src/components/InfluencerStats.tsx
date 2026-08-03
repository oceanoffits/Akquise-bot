import type { Influencer, InfluencerStatus } from "../types";
import { statusLabels } from "./InfluencerList";

interface Props {
  influencers: Influencer[];
}

const STATUS_ORDER: InfluencerStatus[] = [
  "NEW",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "CUSTOMER",
  "DECLINED",
];

function Gauge({ percent }: { percent: number }) {
  const size = 108;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gauge-svg">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-1)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="var(--border)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#gaugeGradient)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

export function InfluencerStats({ influencers }: Props) {
  const total = influencers.length;
  if (total === 0) return null;

  const counts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = 0;
      return acc;
    },
    {} as Record<InfluencerStatus, number>
  );
  influencers.forEach((inf) => {
    counts[inf.status] += 1;
  });

  const inProgress = total - counts.NEW;
  const activityRate = Math.round((inProgress / total) * 100);
  const nonZero = STATUS_ORDER.filter((s) => counts[s] > 0);
  const maxStatus = nonZero.reduce(
    (best, s) => (counts[s] > counts[best] ? s : best),
    nonZero[0]
  );

  return (
    <div className="stats-row">
      <div className="stat-card stat-card-gauge">
        <div className="stat-card-label">Aktivität</div>
        <div className="gauge-wrap">
          <Gauge percent={activityRate} />
          <div className="gauge-center">
            <span className="gauge-value">{activityRate}</span>
            <span className="gauge-unit">%</span>
          </div>
        </div>
        <div className="stat-card-foot">
          {inProgress} von {total} in Bearbeitung
        </div>
      </div>

      <div className="stat-card stat-card-tags">
        <div className="stat-card-label">Status-Verteilung</div>
        <div className="tag-row">
          {nonZero.map((s) => (
            <span
              key={s}
              className={`tag-pill${s === maxStatus ? " tag-pill-highlight" : ""}`}
            >
              {statusLabels[s]} · {counts[s]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
