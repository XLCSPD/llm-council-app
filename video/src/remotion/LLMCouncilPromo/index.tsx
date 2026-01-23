import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

import {
  HookScene,
  ProblemScene,
  SolutionScene,
  CouncilConceptScene,
  SetupPhaseScene,
  ReasoningPhaseScene,
  ReviewPhaseScene,
  SynthesisPhaseScene,
  FeaturesScene,
  TaglineScene,
  CTAScene,
} from './scenes';

loadFont('normal', { weights: ['400', '500', '600', '700', '800'] });

// Scene durations in frames (at 30fps)
const DURATIONS = {
  hook: 90,           // 0:00-0:03 (3 seconds)
  problem: 90,        // 0:03-0:06 (3 seconds)
  solution: 120,      // 0:06-0:10 (4 seconds)
  concept: 120,       // 0:10-0:14 (4 seconds)
  setup: 120,         // 0:14-0:18 (4 seconds)
  reasoning: 120,     // 0:18-0:22 (4 seconds)
  review: 120,        // 0:22-0:26 (4 seconds)
  synthesis: 120,     // 0:26-0:30 (4 seconds)
  features: 120,      // 0:30-0:34 (4 seconds)
  tagline: 180,       // 0:34-0:40 (6 seconds)
  cta: 150,           // 0:40-0:45 (5 seconds)
};

// Calculate cumulative start times
const getStartFrame = (scene: keyof typeof DURATIONS): number => {
  const order: (keyof typeof DURATIONS)[] = [
    'hook', 'problem', 'solution', 'concept', 'setup',
    'reasoning', 'review', 'synthesis', 'features', 'tagline', 'cta'
  ];

  const index = order.indexOf(scene);
  return order.slice(0, index).reduce((sum, key) => sum + DURATIONS[key], 0);
};

export const LLMCouncilPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Hook - "One AI gave you an answer..." */}
      <Sequence from={getStartFrame('hook')} durationInFrames={DURATIONS.hook}>
        <HookScene />
      </Sequence>

      {/* Scene 2: Problem - "...was it the RIGHT answer?" */}
      <Sequence from={getStartFrame('problem')} durationInFrames={DURATIONS.problem}>
        <ProblemScene />
      </Sequence>

      {/* Scene 3: Solution Reveal - Logo + Orb */}
      <Sequence from={getStartFrame('solution')} durationInFrames={DURATIONS.solution}>
        <SolutionScene />
      </Sequence>

      {/* Scene 4: Council Concept - Orbiting models */}
      <Sequence from={getStartFrame('concept')} durationInFrames={DURATIONS.concept}>
        <CouncilConceptScene />
      </Sequence>

      {/* Scene 5: Phase 1 - Setup */}
      <Sequence from={getStartFrame('setup')} durationInFrames={DURATIONS.setup}>
        <SetupPhaseScene />
      </Sequence>

      {/* Scene 6: Phase 2 - Reasoning */}
      <Sequence from={getStartFrame('reasoning')} durationInFrames={DURATIONS.reasoning}>
        <ReasoningPhaseScene />
      </Sequence>

      {/* Scene 7: Phase 3 - Review */}
      <Sequence from={getStartFrame('review')} durationInFrames={DURATIONS.review}>
        <ReviewPhaseScene />
      </Sequence>

      {/* Scene 8: Phase 4 - Synthesis */}
      <Sequence from={getStartFrame('synthesis')} durationInFrames={DURATIONS.synthesis}>
        <SynthesisPhaseScene />
      </Sequence>

      {/* Scene 9: Features Montage */}
      <Sequence from={getStartFrame('features')} durationInFrames={DURATIONS.features}>
        <FeaturesScene />
      </Sequence>

      {/* Scene 10: Tagline */}
      <Sequence from={getStartFrame('tagline')} durationInFrames={DURATIONS.tagline}>
        <TaglineScene />
      </Sequence>

      {/* Scene 11: Call to Action */}
      <Sequence from={getStartFrame('cta')} durationInFrames={DURATIONS.cta}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Total duration: 1350 frames = 45 seconds at 30fps
export const TOTAL_DURATION = Object.values(DURATIONS).reduce((sum, d) => sum + d, 0);
