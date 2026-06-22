// Shared AuthService singleton (the class itself is per-instance in services/auth/xivAuth.ts). On a
// completed XIVAuth sign-in the tokens are already in tokenStore; we open the hub so the onboarding
// wizard's first authenticated RPCs (uploadKeyBundle, saveBasicProfile) succeed without a reload.

import {AuthService} from '../services/auth/xivAuth';
import {connection} from '../services/signal/connection';

export const authService = new AuthService(() => {
    void connection.ensureConnected();
});
