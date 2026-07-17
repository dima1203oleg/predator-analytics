
import React, { useRef, useEffect } from 'react';

export const MatrixRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions based on parent
        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const fontSize = 12;
        const columns = Math.floor(canvas.width / fontSize);
        const drops: number[] = Array(columns).fill(1);
        const chars = "0123456789ABCDEFｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝXY";

        let lastTime = 0;
        const fps = 30;
        const interval = 1000 / fps;
        let animationFrameId: number;

        const draw = (timestamp: number) => {
            animationFrameId = requestAnimationFrame(draw);

            const deltaTime = timestamp - lastTime;
            if (deltaTime < interval) return;

            lastTime = timestamp - (deltaTime % interval);

            // Trail effect (Fade out)
            ctx.fillStyle = 'rgba(2, 6, 23, 0.1)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#3b82f6'; // Blue Matrix for "NAS" feel
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                
                // Randomly highlight some characters
                if (Math.random() > 0.98) ctx.fillStyle = '#fff';
                else ctx.fillStyle = '#3b82f6';

                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop to top randomly
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        // Start loop
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen rounded-lg" />;
};
