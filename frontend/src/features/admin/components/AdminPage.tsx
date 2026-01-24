/**
 * AdminPage - Main admin panel page with tabbed navigation
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, Loader2, Users, Mail, History } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabase';
import { MembersSection } from './MembersSection';
import { InvitesSection } from './InvitesSection';
import { AuditSection } from './AuditSection';

type AdminTab = 'members' | 'invites' | 'audit';

export function AdminPage() {
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  const user = useAuthStore((state) => state.user);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('members');

  // Fetch org and verify admin access
  useEffect(() => {
    if (!user) return;

    const fetchOrg = async () => {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .limit(1);

      if (err || !data?.[0]) {
        setError('Could not find your organization');
        setLoading(false);
        return;
      }

      const { org_id, role } = data[0] as { org_id: string; role: string };

      // Only allow admin/owner access
      if (role !== 'owner' && role !== 'admin') {
        setError('Admin access required');
        setLoading(false);
        return;
      }

      setOrgId(org_id);
      setCurrentUserRole(role);
      setLoading(false);
    };

    fetchOrg();
  }, [user]);

  const isOwner = currentUserRole === 'owner';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => setCurrentView('deliberation')}
            className="px-4 py-2 rounded-xl bg-gradient-accent text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('deliberation')}
            className="p-2 rounded-xl hover:bg-bg-tertiary/50 transition-colors"
            aria-label="Back to deliberation"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-display font-semibold text-text-primary">
              Admin Panel
            </h1>
          </div>
        </div>

        {/* Role Badge */}
        <div
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isOwner
              ? 'bg-purple-500/15 text-purple-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isOwner ? 'Owner' : 'Admin'}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-bg-tertiary/50">
          <TabButton
            active={activeTab === 'members'}
            onClick={() => setActiveTab('members')}
            icon={<Users className="w-4 h-4" />}
            label="Members"
          />
          <TabButton
            active={activeTab === 'invites'}
            onClick={() => setActiveTab('invites')}
            icon={<Mail className="w-4 h-4" />}
            label="Invites"
          />
          <TabButton
            active={activeTab === 'audit'}
            onClick={() => setActiveTab('audit')}
            icon={<History className="w-4 h-4" />}
            label="Audit Log"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'members' && orgId && user && (
          <GlassCard variant="default" padding="lg">
            <MembersSection orgId={orgId} userId={user.id} isOwner={isOwner} />
          </GlassCard>
        )}

        {activeTab === 'invites' && orgId && user && (
          <GlassCard variant="default" padding="lg">
            <InvitesSection orgId={orgId} userId={user.id} />
          </GlassCard>
        )}

        {activeTab === 'audit' && orgId && user && (
          <GlassCard variant="default" padding="lg">
            <AuditSection orgId={orgId} userId={user.id} />
          </GlassCard>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-accent-primary text-white'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
