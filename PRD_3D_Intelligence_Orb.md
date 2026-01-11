# PRD --- 3D Intelligence Orb (Siri-Grade Animation)

## Feature Name

3D Intelligence Orb

## Product Context

The application guides users through a multi-phase AI deliberation
process (Setup → Reasoning → Review → Synthesis). The orb in the
top-right corner acts as a symbolic intelligence anchor, representing
cognition, synthesis, and system state.

## Problem Statement

The current orb animation is flat and decorative. It lacks depth,
internal motion, and emotional resonance, under-delivering on user
expectations for a premium, intelligent system.

## Goal

Create a performant, Siri-quality 3D orb that feels alive, intelligent,
and premium while integrating seamlessly into the existing UI.

## Success Criteria

-   Orb conveys depth and internal motion
-   Comparable perceived quality to Siri / VisionOS orbs
-   No performance degradation on desktop or tablet
-   Positive qualitative feedback on perceived polish

## Non-Goals

-   No full-screen 3D scenes
-   No direct user interaction (v1)
-   No token-level visualization

## Feature Overview

The orb will be rendered as a real-time 3D sphere with animated internal
noise, rim lighting, and bloom to simulate living intelligence.

## Visual Design Requirements

-   True spherical depth
-   Internal fluid motion
-   Fresnel rim lighting
-   Soft glow halo
-   Specular highlight
-   Brand-aligned teal/green palette

## Motion Characteristics

-   Organic, non-looping motion
-   Slow, breathable animation
-   No aggressive rotation or turbulence

## Technical Approach

-   WebGL using React Three Fiber
-   Custom GLSL shader for material
-   Postprocessing bloom
-   Transparent canvas

## Architecture

components/ Orb/ Orb3D.tsx OrbMaterial.ts shaders/ orbVertex.glsl
orbFragment.glsl

## Shader Requirements

### Vertex Shader

-   Subtle surface displacement using noise
-   Time-driven animation

### Fragment Shader

-   Multi-layer animated noise
-   Fresnel rim
-   Radial gradient
-   Internal glow
-   Time uniform

## Performance Requirements

-   Desktop: 60 FPS target
-   Tablet: Stable 30--60 FPS
-   DPR capped at 1.5
-   Reduced-motion support

## UX Integration

-   Replaces existing orb in top-right
-   Ambient, non-distracting
-   Transparent background

## Acceptance Criteria

-   Orb appears 3D with visible depth
-   Internal motion is continuous
-   Glow is subtle and tasteful
-   Reduced-motion respected
-   No layout shift or memory leaks

## QA Scenarios

-   Load Setup page
-   Resize viewport
-   Enable reduced motion
-   Navigate app phases
-   Test on iPad Safari

## Rollout

### Phase 1

-   Single ambient orb

### Phase 2

-   Phase-aware motion

### Phase 3

-   Advanced modulation

## Rationale

The orb serves as a visual signature of intelligence and deliberation,
reinforcing trust, quality, and brand identity.
