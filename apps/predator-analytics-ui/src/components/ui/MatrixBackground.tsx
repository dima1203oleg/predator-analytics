"use client";

import React, { useEffect, useRef } from "react";

export const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const columns = Math.floor(width / 20);
        const drops: number[] = new Array(columns).fill(1);

        const draw = () => {
            // Very subtle dark fade to maintain readability
            ctx.fillStyle = "rgba(2, 6, 23, 0.05)";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "#1e293b"; // Slate-800 color for the "ghost" characters
            ctx.font = "12px monospace";

            for (let i = 0; i < drops.length; i++) {
                // Random characters
                const text = String.fromCharCode(Math.random() * 128);
                const x = i * 20;
                const y = drops[i] * 20;

                // Only draw sometimes for a sparse look
                if (Math.random() > 0.9) {
                   ctx.fillText(text, x, y);
                }

                if (y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        const interval = setInterval(draw, 50);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-20 cyber-blur"
        />
    );
};
