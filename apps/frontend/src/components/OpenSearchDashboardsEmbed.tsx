import React from 'react';

interface OpenSearchDashboardsEmbedProps {
    url?: string;
}

const OpenSearchDashboardsEmbed = ({ url }: OpenSearchDashboardsEmbedProps) => {
    return (
        <div className="w-full h-96 bg-gray-900 rounded-lg border border-blue-500/30 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-400 font-medium">ПІДКЛЮЧЕННЯ ДО OPENSEARCH DASHBOARDS...</p>
                <p className="text-gray-500 text-xs mt-2">{url || 'http://opensearch-dashboards:5601'}</p>
            </div>
        </div>
    );
};

export default OpenSearchDashboardsEmbed;
