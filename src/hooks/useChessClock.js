import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Chess-style clock: each player has a bank of time (timeControlSec).
 * Only the current player's clock drains. When it hits 0, timeout fires.
 * On each new turn the previous player's remaining time is preserved.
 */
export function useChessClock(players, currentTurnMark, status, timeControlSec = 30) {
  // Map of mark -> remaining ms
  const initBanks = useCallback(() => {
    const banks = {};
    (players || []).forEach((p) => {
      banks[p.mark] = timeControlSec * 1000;
    });
    return banks;
  }, [players, timeControlSec]);

  const [banks, setBanks] = useState(initBanks);
  const [activeMark, setActiveMark] = useState(null);
  const lastTickRef = useRef(null);
  const rafRef = useRef(null);

  // Re-init when game restarts (status goes to in_progress freshly)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "in_progress" && status === "in_progress") {
      setBanks(initBanks());
    }
    prevStatusRef.current = status;
  }, [status, initBanks]);

  // Track turn changes — when turn switches, freeze old player's bank
  const prevMarkRef = useRef(null);
  useEffect(() => {
    if (currentTurnMark && currentTurnMark !== prevMarkRef.current) {
      prevMarkRef.current = currentTurnMark;
      setActiveMark(currentTurnMark);
      lastTickRef.current = performance.now();
    }
  }, [currentTurnMark]);

  // RAF drain loop
  useEffect(() => {
    if (status !== "in_progress" || !activeMark) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    function tick(now) {
      if (lastTickRef.current === null) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      setBanks((prev) => {
        const next = { ...prev };
        const remaining = (next[activeMark] ?? 0) - elapsed;
        next[activeMark] = Math.max(0, remaining);
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeMark, status]);

  // Format ms -> "M:SS" or "0:SS"
  function format(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function isLow(ms) {
    return ms <= 10000; // under 10 seconds
  }

  return { banks, format, isLow, activeMark };
}