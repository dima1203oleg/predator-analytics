"use client"

import { Server } from 'lucide-react';
import React from 'react';
import { useIngestionStore } from '../../store/useIngestionStore';
import { cn } from '../../utils/cn';
import { Card, CardContent } from '../ui/card';
import { PipelineMonitor } from './PipelineMonitor';

interface DatabasePipelineMonitorProps {
    className?: string;
    compact?: boolean;
}

export const DatabasePipelineMonitor: React.FC<DatabasePipelineMonitorProps> = ({ className, compact = false }) => {
    const { activeJobs } = useIngestionStore();
    // Get the most recent active job or null
    const jobIds = Object.keys(activeJobs);
    // Sort logic to find most relevant job (e.g., newest starting one)
    const activeJob = jobIds.length > 0
        ? Object.values(activeJobs).sort((a,b) => b.startedAt - a.startedAt)[0]
        : null;

    if (!activeJob) {
        return <IdleState compact={compact} className={className} />;
    }

    return (
        <div className={cn("rounded-2xl overflow-hidden border border-white/5 shadow-2xl", className)}>
             <PipelineMonitor
                jobId={activeJob.id}
                pipelineType={activeJob.type}
                externalStatus={activeJob}
             />
        </div>
    );
};

const IdleState = ({ compact, className }: { compact: boolean, className?: string }) => (
    <Card className={cn("bg-slate-900/40 border-dashed border-slate-800", className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 gap-4 text-center opacity-50">
            <div className="p-4 bg-slate-800 rounded-full">
                <Server size={24} className="text-slate-500" />
            </div>
            <div>
                 <h4 className="text-sm font-bold text-slate-400 uppercase">System Idle</h4>
                 <p className="text-xs text-slate-600 mt-1">No active ingestion pipelines. Ready for data.</p>
            </div>
        </CardContent>
    </Card>
);

export default DatabasePipelineMonitor;
