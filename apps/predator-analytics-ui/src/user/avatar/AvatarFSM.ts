/* ─────────────────────────────────────────────────────────
 * 🧠 AvatarFSM — State machine з transition validation
 * Timer-based auto-transitions (idle timeout).
 * ───────────────────────────────────────────────────────── */
import type { AvatarState } from '../../types/avatar';
import { AVATAR_TRANSITIONS } from '../../types/avatar';

/** Тайм-аути автоповернення до idle (мс) */
const AUTO_IDLE_TIMEOUTS: Partial<Record<AvatarState, number>> = {
    presenting: 15_000,
    alert: 10_000,
    analyzing: 30_000,
};

export class AvatarFSM {
    private _state: AvatarState = 'idle';
    private _timeoutId: ReturnType<typeof setTimeout> | null = null;
    private _onTransition: ((from: AvatarState, to: AvatarState) => void) | null = null;

    get state(): AvatarState {
        return this._state;
    }

    /** Підписка на зміну стану */
    onTransition(callback: (from: AvatarState, to: AvatarState) => void) {
        this._onTransition = callback;
    }

    /** Спроба переходу в новий стан */
    transition(to: AvatarState): boolean {
        const allowed = AVATAR_TRANSITIONS[this._state];
        if (!allowed.includes(to)) {
            return false;
        }

        const from = this._state;
        this._state = to;

        // Скидаємо попередній timeout
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }

        // Встановлюємо auto-idle timeout
        const timeout = AUTO_IDLE_TIMEOUTS[to];
        if (timeout !== undefined) {
            this._timeoutId = setTimeout(() => {
                this.transition('idle');
            }, timeout);
        }

        this._onTransition?.(from, to);
        return true;
    }

    /** Примусове повернення до idle */
    reset() {
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
        const from = this._state;
        this._state = 'idle';
        this._onTransition?.(from, 'idle');
    }

    destroy() {
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
        }
        this._onTransition = null;
    }
}
