import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { colors } from '../styles/colors';

interface ConfidenceBarProps {
  confidence: number; // 0-100
  enterDelay?: number;
  style?: React.CSSProperties;
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  enterDelay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const progress = spring({
    fps,
    frame,
    config: { damping: 100, stiffness: 80 },
    delay: enterDelay,
  });

  // Fill animation (slower)
  const fillProgress = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 50 },
    delay: enterDelay + 15,
  });

  const fillWidth = interpolate(fillProgress, [0, 1], [0, confidence]);

  // Determine color based on confidence
  const getColor = () => {
    if (confidence >= 80) return colors.accentSuccess;
    if (confidence >= 50) return colors.accentWarning;
    return colors.accentError;
  };

  const barColor = getColor();

  return (
    <div
      style={{
        opacity: progress,
        ...style,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <span style={{
            color: colors.textPrimary,
            fontSize: 14,
            fontWeight: 500,
          }}>
            Confidence Level
          </span>
        </div>
        <span style={{
          color: barColor,
          fontSize: 18,
          fontWeight: 700,
        }}>
          {Math.round(fillWidth)}%
        </span>
      </div>

      <div
        style={{
          height: 12,
          background: colors.bgSecondary,
          borderRadius: 6,
          overflow: 'hidden',
          border: `1px solid ${colors.glassBorder}`,
        }}
      >
        <div
          style={{
            width: `${fillWidth}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
            borderRadius: 6,
            boxShadow: `0 0 10px ${barColor}50`,
          }}
        />
      </div>

      {fillProgress > 0.8 && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 12px',
            background: `${barColor}20`,
            border: `1px solid ${barColor}40`,
            borderRadius: 8,
            display: 'inline-block',
            opacity: interpolate(fillProgress, [0.8, 1], [0, 1]),
          }}
        >
          <span style={{ color: barColor, fontSize: 12, fontWeight: 600 }}>
            {confidence >= 80 ? '✓ High Confidence' : confidence >= 50 ? '~ Medium Confidence' : '! Low Confidence'}
          </span>
        </div>
      )}
    </div>
  );
};
