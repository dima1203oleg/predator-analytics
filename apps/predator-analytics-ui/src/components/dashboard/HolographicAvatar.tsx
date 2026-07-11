/**
 * 🧠 Holographic Avatar Component (Proxy)
 * 
 * Тепер проксіює до нової модульної архітектури AvatarScene.
 * Забезпечує зворотну сумісність з існуючим кодом.
 */

import { AvatarShell } from '../avatar/AvatarShell';

export default function HolographicAvatar() {
  return <AvatarShell emotion="idle" />;
}
