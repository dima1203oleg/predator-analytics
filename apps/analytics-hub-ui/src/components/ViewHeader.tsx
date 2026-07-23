import React from 'react';
export default function ViewHeader({ title, subtitle, badge }: any) { 
    return <div className="mb-4"><h1 className="text-2xl font-bold">{title}</h1><p>{subtitle}</p></div>; 
}
