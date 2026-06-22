// Web port of Navigation/Screen.cs + ScreenRouter.cs.
//
// No URL routing — this is a single phone surface, exactly like the in-game window. The router is an
// observable store holding the active screen plus any per-screen params (the chat peer, a viewed
// profile). The shell cross-fades between screens with Framer Motion's AnimatePresence.

import {createStore} from '../state/store';
import type {Guid} from '../shared/wire';

/** Mirrors Navigation/Screen.cs. */
export enum Screen {
    Splash = 'Splash',
    Onboarding = 'Onboarding',
    Deck = 'Deck',
    Match = 'Match',
    ChatList = 'ChatList',
    ChatArchive = 'ChatArchive',
    Chat = 'Chat',
    Profile = 'Profile',
    Settings = 'Settings',
    MyProfile = 'MyProfile',
    Banned = 'Banned',
    WarningsAcknowledge = 'WarningsAcknowledge',
    PassphraseUnlock = 'PassphraseUnlock',
    News = 'News',
    Offline = 'Offline',
    Outdated = 'Outdated',
}

export interface RouteParams {
    /** Chat / Profile peer id. */
    peerId?: Guid;
    /** Peer display name, carried so the chat/profile header renders without a refetch. */
    peerName?: string;
    /** News article id. */
    newsId?: Guid;
    /** Where a pushed sub-screen (e.g. peer Profile) returns to on Back. */
    returnTo?: Screen;
}

export interface Route {
    screen: Screen;
    params: RouteParams;
}

const routeStore = createStore<Route>({screen: Screen.Splash, params: {}});

export const router = {
    store: routeStore,
    get current(): Route {
        return routeStore.get();
    },
    navigate(screen: Screen, params: RouteParams = {}): void {
        routeStore.set({screen, params});
    },
};
