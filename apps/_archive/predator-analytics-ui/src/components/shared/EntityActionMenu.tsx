import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Network, Eye, Download, Star, Lock } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { ROLE_CAPABILITIES } from '@/config/roles';

interface EntityActionMenuProps {
  entityId: string;
  entityType: 'company' | 'person' | 'vessel' | 'customs_declaration' | 'tender';
  entityName?: string;
  onAction?: (action: string, id: string) => void;
}

export const EntityActionMenu: React.FC<EntityActionMenuProps> = ({
  entityId,
  entityType,
  entityName = 'Суб\'єкт',
  onAction,
}) => {
  const { role } = useRole();
  const capabilities = ROLE_CAPABILITIES[role];

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, entityId);
    } else {
      console.log(`Action ${action} triggered for ${entityType} ${entityId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 hover:bg-white/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50">
        <MoreVertical size={18} className="text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-black/90 border-white/10 backdrop-blur-xl rounded-xl shadow-2xl p-2"
      >
        <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
          Дії: {entityName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />

        <DropdownMenuItem
          onClick={() => handleAction('graph')}
          className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
        >
          <Network size={14} className="text-blue-400" />
          <span className="text-white text-xs font-medium">Пошук зв'язків</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            if (capabilities.canDeAnonymize) handleAction('deanonymize');
          }}
          data-disabled={!capabilities.canDeAnonymize}
          className={`flex items-center justify-between gap-3 py-2 px-3 rounded-lg transition-colors ${
            capabilities.canDeAnonymize
              ? 'hover:bg-white/5 cursor-pointer text-white'
              : 'opacity-50 cursor-not-allowed text-slate-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <Eye size={14} className={capabilities.canDeAnonymize ? 'text-amber-500' : 'text-slate-600'} />
            <span className="text-xs font-medium">Деанонімізація</span>
          </div>
          {!capabilities.canDeAnonymize && <Lock size={12} className="text-slate-600" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleAction('export')}
          className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors text-white"
        >
          <Download size={14} className="text-emerald-400" />
          <span className="text-xs font-medium">Експорт досьє</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5" />

        <DropdownMenuItem
          onClick={() => handleAction('track')}
          className="flex items-center gap-3 py-2 px-3 hover:bg-[#D4AF37]/10 rounded-lg cursor-pointer transition-colors text-[#D4AF37]"
        >
          <Star size={14} />
          <span className="text-xs font-medium">Відстежувати</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
