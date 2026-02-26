import React from 'react';

interface NeutralizedContentProps {
    content?: string;
}

const NeutralizedContent = ({ content }: NeutralizedContentProps) => {
    return (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-red-500/30">
            <h3 className="text-red-400 font-bold mb-2">НЕЙТРАЛІЗОВАНИЙ КОНТЕНТ</h3>
            <p className="text-gray-300 text-sm">{content || 'Контент було заблоковано системою безпеки Predator Guardian.'}</p>
        </div>
    );
};

export default NeutralizedContent;
