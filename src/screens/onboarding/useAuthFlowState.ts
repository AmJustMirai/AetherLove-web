// Subscribes to the shared AuthService and returns a stable snapshot. The service's `snapshot` getter
// builds a fresh object each call (unsafe for useSyncExternalStore), so we mirror it into React state on
// each emit instead.

import { useEffect, useState } from 'react';
import { authService } from '../../state/auth';
import type { AuthFlowSnapshot } from '../../services/auth/xivAuth';

export function useAuthFlowState(): AuthFlowSnapshot {
  const [snap, setSnap] = useState<AuthFlowSnapshot>(authService.snapshot);
  useEffect(() => authService.subscribe(setSnap), []);
  return snap;
}
