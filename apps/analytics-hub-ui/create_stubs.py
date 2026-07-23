import os

base = "/Users/Shared/Predator_60/apps/analytics-hub-ui/src"

stubs = {
    "utils/cn.ts": """export function cn(...args: any[]) { return args.filter(Boolean).join(' '); }
""",
    "components/ui/button.tsx": """import React from 'react';
import { cn } from '@/utils/cn';
export const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn("px-4 py-2 bg-blue-500 text-white rounded", className)} {...props} />
));
Button.displayName = "Button";
""",
    "components/ui/badge.tsx": """import React from 'react';
import { cn } from '@/utils/cn';
export function Badge({ className, variant, ...props }: any) {
    return <div className={cn("inline-block px-2 py-1 text-xs font-bold rounded", className)} {...props} />;
}
""",
    "components/ui/progress.tsx": """import React from 'react';
import { cn } from '@/utils/cn';
export function Progress({ className, value, ...props }: any) {
    return <div className={cn("w-full bg-gray-200 rounded", className)} {...props}>
        <div className="bg-blue-500 h-full rounded" style={{ width: `${value || 0}%` }} />
    </div>;
}
""",
    "components/ui/HoloCard.tsx": """import React from 'react';
import { cn } from '@/utils/cn';
export function HoloCard({ className, title, variant, children, ...props }: any) {
    return <div className={cn("border border-blue-500/30 p-4 rounded-xl", className)} {...props}>
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        {children}
    </div>;
}
""",
    "components/ui/SlideToExecute.tsx": """import React from 'react';
export function SlideToExecute({ onExecute }: any) {
    return <button onClick={onExecute} className="w-full bg-green-500 text-white p-2 rounded">Execute (Stub)</button>;
}
""",
    "components/polish/BrandLoader.tsx": """import React from 'react';
export function BrandLoader() { return <div>Loading...</div>; }
""",
    "components/graph/GraphViewer.tsx": """import React from 'react';
export function GraphViewer({ data, onNodeClick }: any) { return <div className="h-64 bg-gray-800">Graph Placeholder</div>; }
""",
    "components/ECharts.tsx": """import React from 'react';
export default function EChartsReact({ option }: any) { return <div className="h-64 bg-gray-800">Chart Placeholder</div>; }
""",
    "components/layout/PageTransition.tsx": """import React from 'react';
export default function PageTransition({ children }: any) { return <>{children}</>; }
""",
    "components/ViewHeader.tsx": """import React from 'react';
export default function ViewHeader({ title, subtitle, badge }: any) { 
    return <div className="mb-4"><h1 className="text-2xl font-bold">{title}</h1><p>{subtitle}</p></div>; 
}
""",
    "components/AdvancedBackground.tsx": """import React from 'react';
export default function AdvancedBackground() { return null; }
""",
    "components/CyberGrid.tsx": """import React from 'react';
export default function CyberGrid() { return null; }
""",
    "services/api.ts": """export const api = { get: async () => ({}), post: async () => ({}) };""",
    "services/api/factory.ts": """export const useFactoryApi = () => ({ executeRun: async () => {}, getRuns: async () => [] });""",
    "hooks/useAdminApi.ts": """export const useAdminApi = () => ({ fetchMetrics: async () => ({}) });""",
    "hooks/useUISound.ts": """export const useUISound = () => ({ play: () => {} });""",
}

for rel_path, content in stubs.items():
    full_path = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    if not os.path.exists(full_path):
        with open(full_path, "w") as f:
            f.write(content)

print("Stubs created.")
