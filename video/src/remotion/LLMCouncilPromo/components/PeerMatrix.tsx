import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate, interpolateColors } from 'remotion';
import { colors } from '../styles/colors';

interface PeerMatrixProps {
  enterDelay?: number;
  style?: React.CSSProperties;
}

const models = ['GPT-5', 'Claude', 'Gemini', 'Grok'];
const scores = [
  ['-', 8, 7, 9],
  [9, '-', 8, 7],
  [8, 9, '-', 8],
  [7, 8, 9, '-'],
];

export const PeerMatrix: React.FC<PeerMatrixProps> = ({
  enterDelay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const progress = spring({
    fps,
    frame,
    config: { damping: 100, stiffness: 100 },
    delay: enterDelay,
  });

  const cellSize = 60;
  const headerSize = 80;

  return (
    <div
      style={{
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
        background: colors.glassBg,
        border: `1px solid ${colors.glassBorder}`,
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      <div style={{
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        Peer Review Matrix
      </div>

      <div style={{ display: 'flex' }}>
        {/* Empty corner */}
        <div style={{ width: headerSize, height: cellSize }} />

        {/* Column headers */}
        {models.map((model, i) => {
          const headerProgress = spring({
            fps,
            frame,
            config: { damping: 100, stiffness: 150 },
            delay: enterDelay + i * 5,
          });

          return (
            <div
              key={`header-${model}`}
              style={{
                width: cellSize,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textSecondary,
                fontSize: 10,
                fontWeight: 500,
                opacity: headerProgress,
              }}
            >
              {model}
            </div>
          );
        })}
      </div>

      {/* Rows */}
      {models.map((rowModel, rowIndex) => (
        <div key={`row-${rowModel}`} style={{ display: 'flex' }}>
          {/* Row header */}
          <div
            style={{
              width: headerSize,
              height: cellSize,
              display: 'flex',
              alignItems: 'center',
              color: colors.textSecondary,
              fontSize: 10,
              fontWeight: 500,
              paddingRight: 8,
              justifyContent: 'flex-end',
            }}
          >
            {rowModel}
          </div>

          {/* Cells */}
          {scores[rowIndex].map((score, colIndex) => {
            const cellDelay = enterDelay + 15 + (rowIndex * 4 + colIndex) * 3;
            const cellProgress = spring({
              fps,
              frame,
              config: { damping: 100, stiffness: 200 },
              delay: cellDelay,
            });

            const isScore = typeof score === 'number';
            const bgColor = isScore
              ? interpolateColors(
                  score as number,
                  [1, 5, 10],
                  [colors.accentError, colors.accentWarning, colors.accentSuccess]
                )
              : 'transparent';

            return (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 2,
                  borderRadius: 8,
                  background: isScore ? `${bgColor}30` : 'transparent',
                  border: isScore ? `1px solid ${bgColor}50` : '1px solid transparent',
                  color: isScore ? colors.textPrimary : colors.textMuted,
                  fontSize: 16,
                  fontWeight: 600,
                  opacity: cellProgress,
                  transform: `scale(${cellProgress})`,
                }}
              >
                {isScore ? Math.round((score as number) * cellProgress) : score}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
