import { useState } from 'react';
import { ChevronDown, Sparkles, Zap, Briefcase, Microscope, ShieldAlert, Code, type LucideIcon } from 'lucide-react';
import { SYSTEM_PRESETS } from '@/data/systemPresets';
import { useCouncilStore } from '@/store';
import { GlowBadge } from '@/components/ui';
import type { CouncilMember } from '@/types';

// Map icon names to Lucide components
const PRESET_ICONS: Record<string, LucideIcon> = {
  'zap': Zap,
  'briefcase': Briefcase,
  'microscope': Microscope,
  'shield-alert': ShieldAlert,
  'code': Code,
};

interface CouncilPresetSelectorProps {
  onSelect?: () => void;
}

export function CouncilPresetSelector({ onSelect }: CouncilPresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedModels, availableModels } = useCouncilStore();

  const handleSelectPreset = (presetId: string) => {
    const preset = SYSTEM_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Convert preset members to CouncilMember format
    const members: CouncilMember[] = preset.members.map((m) => {
      // Find the model info from available models
      const modelInfo = availableModels.find((am) => am.id === m.model_id);

      return {
        id: crypto.randomUUID(),
        model_id: m.model_id,
        role: m.role,
        weight: m.weight,
        token_limit: m.token_limit,
        enabled: true,
        display_name: m.display_name || modelInfo?.display_name || m.model_id,
      };
    });

    setSelectedModels(members);
    setIsOpen(false);
    onSelect?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-subtle hover:bg-accent/10 transition-colors text-sm"
      >
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-text-secondary">Presets</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown - solid background for readability */}
          <div className="absolute top-full right-0 mt-2 w-72 z-50 animate-fade-in rounded-xl bg-bg-primary border border-border shadow-xl p-3">
            <div className="text-xs font-medium text-text-muted mb-2 px-2">
              Quick Start Presets
            </div>
            <div className="space-y-1">
              {SYSTEM_PRESETS.map((preset) => {
                const IconComponent = preset.icon ? PRESET_ICONS[preset.icon] : null;
                return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/10 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                    {IconComponent && <IconComponent className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary group-hover:text-accent-secondary transition-colors">
                      {preset.name}
                    </div>
                    <div className="text-xs text-text-muted line-clamp-2">
                      {preset.description}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {preset.members.slice(0, 3).map((m, idx) => (
                        <GlowBadge
                          key={idx}
                          variant={
                            m.role === 'thinker' ? 'thinker' :
                            m.role === 'critic' ? 'critic' :
                            m.role === 'devils_advocate' ? 'devils-advocate' :
                            'synthesizer'
                          }
                          size="sm"
                        >
                          {m.role === 'devils_advocate' ? 'DA' : m.role.charAt(0).toUpperCase()}
                        </GlowBadge>
                      ))}
                      {preset.members.length > 3 && (
                        <span className="text-xs text-text-muted">
                          +{preset.members.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
