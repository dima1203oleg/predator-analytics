/* ─────────────────────────────────────────────────────────
 * 📱 useDeviceClass — визначення типу пристрою
 * desktop / tablet / mobile на основі ширини + touch.
 * ───────────────────────────────────────────────────────── */
import { useState, useEffect } from 'react';
import type { DeviceClass } from '../types/performance';
import { DEVICE_BREAKPOINTS } from '../types/performance';

function getDeviceClass(width: number): DeviceClass {
    if (width <= DEVICE_BREAKPOINTS.mobile.maxWidth) return 'mobile';
    if (width <= DEVICE_BREAKPOINTS.tablet.maxWidth) return 'tablet';
    return 'desktop';
}

export function useDeviceClass(): DeviceClass {
    const [deviceClass, setDeviceClass] = useState<DeviceClass>(() =>
        getDeviceClass(typeof window !== 'undefined' ? window.innerWidth : 1920)
    );

    useEffect(() => {
        const handleResize = () => {
            setDeviceClass(getDeviceClass(window.innerWidth));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return deviceClass;
}
