// LLM Council Brand Colors - matching frontend/src/styles/variables.css

export const colors = {
  // Backgrounds
  bgBase: '#0A1628',
  bgPrimary: '#0F1D32',
  bgSecondary: '#152238',
  bgTertiary: '#1A2942',
  bgElevated: '#1F3150',

  // Glass effects
  glassBg: 'rgba(26, 54, 93, 0.4)',
  glassBorder: 'rgba(94, 234, 212, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Accents
  accentPrimary: '#0D9488',    // Teal
  accentSecondary: '#5EEAD4',  // Cyan
  accentSuccess: '#10B981',    // Green
  accentWarning: '#F59E0B',    // Amber
  accentError: '#EF4444',      // Red

  // Role colors
  roleThinker: '#6366F1',         // Indigo
  roleCritic: '#F59E0B',          // Amber
  roleDevilsAdvocate: '#EF4444',  // Red
  roleSynthesizer: '#0D9488',     // Teal

  // Model provider colors
  modelOpenAI: '#10B981',
  modelAnthropic: '#D97706',
  modelGoogle: '#6366F1',
  modelXAI: '#FFFFFF',
  modelMeta: '#3B82F6',
  modelDeepSeek: '#0EA5E9',
};

// Glow effects - PUNCHED UP for more drama
export const glows = {
  teal: '0 0 40px rgba(13, 148, 136, 0.5)',
  cyan: '0 0 50px rgba(94, 234, 212, 0.4)',
  tealStrong: '0 0 80px rgba(13, 148, 136, 0.7)',
  white: '0 0 40px rgba(255, 255, 255, 0.4)',
  intense: '0 0 100px rgba(94, 234, 212, 0.6)',
};

// Spring configurations - LIVELIER with more bounce
export const springConfigs = {
  smooth: { damping: 100, stiffness: 150, mass: 0.5 },
  bouncy: { damping: 8, stiffness: 180, mass: 0.4 },
  snappy: { damping: 50, stiffness: 300, mass: 0.3 },
  gentle: { damping: 150, stiffness: 80, mass: 0.8 },
  pop: { damping: 12, stiffness: 250, mass: 0.3 },      // New: for pop-in effects
  elastic: { damping: 6, stiffness: 200, mass: 0.5 },   // New: for elastic bounces
};

// Gradient definitions
export const gradients = {
  accent: 'linear-gradient(135deg, #0D9488 0%, #5EEAD4 100%)',
  accentHover: 'linear-gradient(135deg, #0F766E 0%, #2DD4BF 100%)',
  background: 'linear-gradient(180deg, #0A1628 0%, #0F1D32 100%)',
};
