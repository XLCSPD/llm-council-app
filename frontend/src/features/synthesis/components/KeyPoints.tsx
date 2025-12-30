import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface KeyPointsProps {
  agreements: string[];
  disagreements: string[];
  minorityOpinions?: string[];
}

interface PointsSectionProps {
  title: string;
  points: string[];
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  defaultExpanded?: boolean;
}

function PointsSection({
  title,
  points,
  icon,
  colorClass,
  bgClass,
  defaultExpanded = true,
}: PointsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (points.length === 0) return null;

  return (
    <div className={`rounded-lg border border-border overflow-hidden ${bgClass}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-bg-tertiary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={`font-medium ${colorClass}`}>{title}</span>
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
            {points.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <ul className="space-y-2">
            {points.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorClass.replace('text-', 'bg-')}`} />
                <span className="text-text-primary text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function KeyPoints({ agreements, disagreements, minorityOpinions = [] }: KeyPointsProps) {
  return (
    <div className="space-y-3">
      <PointsSection
        title="Key Agreements"
        points={agreements}
        icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
        colorClass="text-green-500"
        bgClass="bg-green-500/5"
        defaultExpanded={true}
      />
      <PointsSection
        title="Key Disagreements"
        points={disagreements}
        icon={<XCircle className="w-5 h-5 text-red-500" />}
        colorClass="text-red-500"
        bgClass="bg-red-500/5"
        defaultExpanded={true}
      />
      {minorityOpinions.length > 0 && (
        <PointsSection
          title="Minority Opinions"
          points={minorityOpinions}
          icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
          colorClass="text-yellow-500"
          bgClass="bg-yellow-500/5"
          defaultExpanded={false}
        />
      )}
    </div>
  );
}

interface CompactKeyPointsProps {
  agreements: string[];
  disagreements: string[];
}

export function CompactKeyPoints({ agreements, disagreements }: CompactKeyPointsProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-text-secondary">
          <span className="font-medium text-green-500">{agreements.length}</span> agreements
        </span>
      </div>
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-text-secondary">
          <span className="font-medium text-red-500">{disagreements.length}</span> disagreements
        </span>
      </div>
    </div>
  );
}
