'use client'

import React from 'react';

interface VariableHeaderProps {
    title?: string[];
    alias?: string[];
}

export const VariableHeader: React.FC<VariableHeaderProps> = ({ title, alias }) => {
    if (!title && !alias) return null;

    return (
        <div className="mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-left">
                {title?.[0] || alias?.[0]}
            </h2>
            {title && alias && title[0] !== alias[0] && (
                <p className="text-gray-600 text-left text-sm mt-1">
                    {alias[0]}
                </p>
            )}
        </div>
    );
};

export default VariableHeader;
