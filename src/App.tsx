// App root: mounts the phone shell and cross-fades between screens based on the router store. Replaces
// the Phase-1 placeholder. Mirrors MainPluginWindow rendering the active screen with a fade transition.

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './app/AppShell';
import { router, Screen } from './app/router';
import { registerPushHandlers } from './app/pushHandlers';
import { useStore } from './state/hooks';

import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/onboarding/OnboardingScreen';
import { DeckScreen } from './screens/deck/DeckScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ChatArchiveScreen, ChatListScreen } from './screens/chat/ChatListScreen';
import { ChatScreen } from './screens/chat/ChatScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MyProfileScreen } from './screens/MyProfileScreen';
import { OfflineScreen } from './screens/OfflineScreen';
import { OutdatedScreen } from './screens/OutdatedScreen';
import { BannedScreen } from './screens/BannedScreen';
import { WarningsAcknowledgeScreen } from './screens/WarningsAcknowledgeScreen';
import { ModeratorMessageScreen } from './screens/ModeratorMessageScreen';
import { PassphraseUnlockScreen } from './screens/PassphraseUnlockScreen';
import { EncryptionRecoveryScreen } from './screens/EncryptionRecoveryScreen';
import { NewsScreen } from './screens/NewsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';

function renderScreen(screen: Screen) {
  switch (screen) {
    case Screen.Splash:
      return <SplashScreen />;
    case Screen.Onboarding:
      return <OnboardingScreen />;
    case Screen.Deck:
      return <DeckScreen />;
    case Screen.Match:
      return <MatchScreen />;
    case Screen.ChatList:
      return <ChatListScreen />;
    case Screen.ChatArchive:
      return <ChatArchiveScreen />;
    case Screen.Chat:
      return <ChatScreen />;
    case Screen.Settings:
      return <SettingsScreen />;
    case Screen.MyProfile:
      return <MyProfileScreen />;
    case Screen.Offline:
      return <OfflineScreen />;
    case Screen.Outdated:
      return <OutdatedScreen />;
    case Screen.Banned:
      return <BannedScreen />;
    case Screen.WarningsAcknowledge:
      return <WarningsAcknowledgeScreen />;
    case Screen.ModeratorMessages:
      return <ModeratorMessageScreen />;
    case Screen.PassphraseUnlock:
      return <PassphraseUnlockScreen />;
    case Screen.EncryptionRecovery:
      return <EncryptionRecoveryScreen />;
    case Screen.News:
      return <NewsScreen />;
    case Screen.Profile:
      return <ProfileScreen />;
    default:
      return <PlaceholderScreen screen={screen} />;
  }
}

export default function App() {
  const route = useStore(router.store);

  useEffect(() => {
    registerPushHandlers();
  }, []);

  return (
    <AppShell>
      <AnimatePresence>
        <motion.div
          key={route.screen}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {renderScreen(route.screen)}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
