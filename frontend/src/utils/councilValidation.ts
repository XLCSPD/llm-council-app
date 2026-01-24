/**
 * Council validation utilities for frontend balance checking.
 *
 * This mirrors the backend validation logic to provide instant UI feedback.
 * The backend remains the source of truth for actual enforcement.
 */

import type { CouncilMember, RoleType, ModelInfo } from '@/types';

/** Roles that count as adversarial (provide critical perspective) */
export const ADVERSARIAL_ROLES: RoleType[] = ['critic', 'devils_advocate'];

/** Default model to suggest when no suitable model can be reassigned */
export const DEFAULT_CRITIC_MODEL = 'google/gemini-2.0-flash-001';

/** Status of council balance */
export interface BalanceStatus {
  /** Whether the council is balanced (has adversarial role) */
  isBalanced: boolean;
  /** Whether the council has at least one adversarial role */
  hasAdversarialRole: boolean;
  /** Number of chair/synthesizer roles */
  chairCount: number;
  /** Number of enabled members */
  memberCount: number;
  /** List of validation issues */
  issues: string[];
  /** Whether auto-balance will be applied on run start */
  willAutoBalance: boolean;
}

/**
 * Get the balance status of a council.
 *
 * @param members - List of council members
 * @param autoBalanceEnabled - Whether auto-balance setting is on (default: true)
 * @returns Balance status object
 */
export function getBalanceStatus(
  members: CouncilMember[],
  autoBalanceEnabled = true
): BalanceStatus {
  const enabledMembers = members.filter((m) => m.enabled);
  const hasAdversarialRole = enabledMembers.some((m) =>
    ADVERSARIAL_ROLES.includes(m.role)
  );
  const chairCount = enabledMembers.filter((m) => m.role === 'synthesizer').length;
  const memberCount = enabledMembers.length;

  const issues: string[] = [];

  if (memberCount < 2) {
    issues.push('Minimum 2 models required');
  }

  if (chairCount > 1) {
    issues.push('Maximum 1 chair allowed');
  }

  if (!hasAdversarialRole && memberCount >= 2) {
    issues.push("No adversarial role (critic or devil's advocate)");
  }

  const isBalanced = hasAdversarialRole && chairCount <= 1 && memberCount >= 2;
  const willAutoBalance = !hasAdversarialRole && memberCount >= 2 && autoBalanceEnabled;

  return {
    isBalanced,
    hasAdversarialRole,
    chairCount,
    memberCount,
    issues,
    willAutoBalance,
  };
}

/**
 * Find the cheapest non-chair model in the council.
 *
 * @param members - List of council members
 * @param availableModels - List of available models with cost info
 * @returns The cheapest non-chair member, or null if all are chairs
 */
export function findCheapestNonChairModel(
  members: CouncilMember[],
  availableModels: ModelInfo[]
): CouncilMember | null {
  const nonChairs = members.filter(
    (m) => m.role !== 'synthesizer' && m.enabled
  );

  if (nonChairs.length === 0) return null;

  // Sort by output cost (usually the more expensive metric)
  const sorted = [...nonChairs].sort((a, b) => {
    const costA =
      availableModels.find((m) => m.id === a.model_id)?.cost_per_1k_output ??
      Infinity;
    const costB =
      availableModels.find((m) => m.id === b.model_id)?.cost_per_1k_output ??
      Infinity;
    return costA - costB;
  });

  return sorted[0] ?? null;
}

/**
 * Perform a one-click fix to add a critic role.
 * Finds the cheapest non-chair model and returns a modified copy with critic role.
 *
 * @param members - Current council members
 * @param availableModels - Available models with cost info
 * @returns Updated members array with one model changed to critic
 */
export function applyOneClickFix(
  members: CouncilMember[],
  availableModels: ModelInfo[]
): CouncilMember[] {
  const cheapest = findCheapestNonChairModel(members, availableModels);

  if (!cheapest) {
    // All members are chairs - can't fix
    return members;
  }

  return members.map((m) => {
    if (m.id === cheapest.id) {
      return { ...m, role: 'critic' as RoleType };
    }
    return m;
  });
}

/**
 * Check if a council configuration is valid for running.
 * This is a stricter check than balance - it includes all hard constraints.
 *
 * @param members - List of council members
 * @returns Object with valid flag and error messages
 */
export function validateCouncil(members: CouncilMember[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const enabledMembers = members.filter((m) => m.enabled);

  if (enabledMembers.length < 2) {
    errors.push('Council must have at least 2 members');
  }

  const chairCount = enabledMembers.filter((m) => m.role === 'synthesizer').length;
  if (chairCount > 1) {
    errors.push('Council can have at most 1 chair');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
