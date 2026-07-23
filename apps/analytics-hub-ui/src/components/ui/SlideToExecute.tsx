import React from 'react';
export function SlideToExecute({ onExecute }: any) {
    return <button onClick={onExecute} className="w-full bg-green-500 text-white p-2 rounded">Execute (Stub)</button>;
}
