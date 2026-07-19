import sys
import re

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

start_marker = "{/* Middle Column: Dossier Card Profile (Section 13) */}"
end_marker = "{/* Right Column: Dynamic Link Graph & Cargo Routes Visualizers (Section 14 & 15) */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

dossier_content = content[start_idx:end_idx]

# Create OsintDossierPanel.tsx
dossier_file = "/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintDossierPanel.tsx"
dossier_code = """import React, { useState } from 'react';
import { 
  User, Users, Wallet, Brain, Stethoscope, AlertCircle, 
  AlertTriangle, ShieldAlert, DollarSign, Truck, 
  Briefcase, Landmark, Hash, Globe 
} from 'lucide-react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

export const OsintDossierPanel: React.FC<{
  activeEntity: OsintEntity;
  userRole: string;
  onSelectEntityForInspector: (entity: OsintEntity) => void;
}> = ({ activeEntity, userRole, onSelectEntityForInspector }) => {
  const [activePersonTab, setActivePersonTab] = useState<'general' | 'family' | 'assets' | 'psychology' | 'medical' | 'compromat'>('general');

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ACTIVE</div>;
      case 'WANTED': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">WANTED (INTERPOL)</div>;
      case 'LIQUIDATED': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">LIQUIDATED</div>;
      case 'UNDER_INVESTIGATION': return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">INVESTIGATION</div>;
      default: return <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{status}</div>;
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 85) return "text-rose-500 border-rose-500 bg-rose-500/10";
    if (score > 60) return "text-amber-500 border-amber-500 bg-amber-500/10";
    return "text-emerald-500 border-emerald-500 bg-emerald-500/10";
  };

  return (
""" + dossier_content + """
  );
};
"""

with open(dossier_file, 'w') as f:
    f.write(dossier_code)

# Replace the dossier content in OsintWorkbench with the component usage
replacement = """{/* Middle Column: Dossier Card Profile (Section 13) */}
        <OsintDossierPanel 
          activeEntity={activeEntity}
          userRole={userRole}
          onSelectEntityForInspector={onSelectEntityForInspector}
        />\n\n        """

content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)

print("Extracted OsintDossierPanel")
