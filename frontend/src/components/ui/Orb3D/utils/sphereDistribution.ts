/**
 * Fibonacci Sphere Distribution
 *
 * Generates evenly distributed points on a sphere surface using the golden ratio spiral.
 * This avoids the clustering at poles that occurs with latitude/longitude grids.
 */

export interface SpherePointData {
  positions: Float32Array;    // xyz for each point (count * 3)
  randomSeeds: Float32Array;  // Per-particle random value for variation
}

/**
 * Generate evenly distributed points on a sphere using Fibonacci spiral
 * @param count Number of particles to generate
 * @param radius Sphere radius (default 1.0)
 * @returns Position and random seed arrays for BufferGeometry
 */
export function generateFibonacciSphere(count: number, radius: number = 1.0): SpherePointData {
  const positions = new Float32Array(count * 3);
  const randomSeeds = new Float32Array(count);

  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = Math.PI * 2 * goldenRatio;

  for (let i = 0; i < count; i++) {
    // Distribute points from -1 to 1 along y-axis
    const y = 1 - (i / (count - 1)) * 2;

    // Calculate radius at this y level (sphere cross-section)
    const radiusAtY = Math.sqrt(1 - y * y);

    // Golden angle for even spiral distribution
    const theta = angleIncrement * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;

    // Random seed for per-particle variation (0-100 range)
    randomSeeds[i] = Math.random() * 100;
  }

  return { positions, randomSeeds };
}
