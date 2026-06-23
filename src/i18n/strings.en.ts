// English string catalog — the source-of-truth locale. Keys mirror the plugin's dotted Loc.T("…")
// namespaces (Services/Localization/Strings/Localization.*.cs) so the other five language tables can be
// dropped in later as parallel records. Positional args interpolate as {0}, {1}, … (see i18n/index.ts).

export const en = {
  // ---- Common ----
  'common.back': 'Back',
  'common.next': 'Next',
  'common.cancel': 'Cancel',
  'common.retry': 'Retry',
  'common.save': 'Save',
  'common.close': 'Close',
  'common.loading': 'Loading…',
  'common.you': 'You',

  // ---- Splash ----
  'splash.tap_to_continue': 'Tap to continue',
  'splash.connecting': 'Connecting…',

  // ---- Onboarding (headers) ----
  'onboarding.header_welcome': 'Welcome',
  'onboarding.header_how_it_works': 'How it works',
  'onboarding.header_terms_of_service': 'Terms of service',
  'onboarding.header_sign_in': 'Sign in',
  'onboarding.header_secure_messages': 'Secure messages',
  'onboarding.header_your_profile': 'Your profile',
  'onboarding.header_profile_picture': 'Profile picture',
  'onboarding.header_your_photos': 'Your photos',
  'onboarding.header_optional_details': 'Optional details',
  'onboarding.header_match_preferences': 'Match preferences',
  'onboarding.header_make_it_yours': 'Make it yours',
  'onboarding.header_all_set': 'All set',

  // ---- Onboarding (nav) ----
  'onboarding.next': 'Next',
  'onboarding.back': 'Back',
  'onboarding.step_counter': 'Step {0} of {1}',
  'onboarding.retry': 'Retry',
  'onboarding.saving': 'Saving…',
  'onboarding.finish': 'Finish',
  'onboarding.start_swiping': 'Start swiping',

  // ---- Onboarding (steps) ----
  'onboarding.welcome_title': 'AetherLove',
  'onboarding.welcome_body': 'Meet other Warriors of Light. Swipe, match, and chat — privately.',
  'onboarding.welcome_language': 'Language',
  'onboarding.how_it_works_body':
    'Swipe through profiles. When two people like each other, it’s a match — and you can start an end-to-end encrypted chat.',
  'onboarding.tos_body':
    'AetherLove — Terms of Service\n\n' +
    '1. Eligibility. You must be 18 years of age or older to use AetherLove. By accepting these terms you confirm that you are an adult. Accounts found to belong to minors are removed immediately and permanently.\n\n' +
    '2. Your account. You are responsible for activity on your account and for keeping your sign-in and passphrase secure. Your messages are end-to-end encrypted with a key derived from your passphrase: we cannot read them and we cannot recover them for you if you lose it.\n\n' +
    '3. Conduct. Treat other Warriors of Light with respect. The following are not permitted: harassment, threats, hate speech, or stalking; impersonating another person; soliciting money, scams, or spam; sharing another person’s private messages, images, or real-world identity without consent; any content involving minors, real or fictional.\n\n' +
    '4. Content. You are solely responsible for what you upload and send. NSFW and ERP content is permitted only between consenting adults and only where you have marked your profile accordingly. Do not upload photos you do not have the right to share.\n\n' +
    '5. Enforcement. We may issue warnings, suspend, or permanently ban accounts that break these rules, with or without notice. Serious violations — especially anything involving minors or non-consensual content — are removed on sight and may be reported to the relevant authorities.\n\n' +
    '6. No warranty. AetherLove is provided “as is”, without warranty of any kind. We are not responsible for the conduct of other users or for interactions that take place outside the app.\n\n' +
    '7. Not affiliated with Square Enix. AetherLove is an unofficial fan project. FINAL FANTASY XIV and all related marks are trademarks of Square Enix. This service is not endorsed by or affiliated with Square Enix.\n\n' +
    '8. Changes. We may update these terms; continued use after a change means you accept the updated terms.',
  'onboarding.tos_accept': 'I have read and accept the terms',
  'onboarding.tos_wait': 'Please take a moment to read ({0}s)',
  'onboarding.auth_intro': 'Sign in with your XIVAuth account to continue.',
  'onboarding.auth_open': 'Sign in with XIVAuth',
  'onboarding.auth_awaiting': 'Waiting for sign-in in the opened tab…',
  'onboarding.auth_reopen': 'Re-open sign-in tab',
  'onboarding.auth_done': 'Signed in',
  'onboarding.passphrase_intro':
    'Your messages are encrypted with a key only you can unlock. Choose a passphrase — we can never recover it for you.',
  'onboarding.passphrase_label': 'Passphrase',
  'onboarding.passphrase_confirm': 'Confirm passphrase',
  'onboarding.passphrase_mismatch': 'Passphrases don’t match.',
  'onboarding.passphrase_too_short': 'Use at least 8 characters.',
  'onboarding.profile_display_name': 'Display name',
  'onboarding.profile_bio': 'Bio',
  'onboarding.profile_languages': 'Languages you speak',
  'onboarding.profile_looking_for': 'Looking for',
  'onboarding.profile_region': 'Region',
  'onboarding.profile_gender': 'Gender',
  'onboarding.profile_race': 'Race',
  'onboarding.avatar_intro': 'Pick a profile picture. It must be safe-for-work.',
  'onboarding.avatar_choose': 'Choose image',
  'onboarding.photos_intro': 'Add up to four photos. The first one is shown on your card.',
  'onboarding.photos_add': 'Add photo',
  'onboarding.optional_intro': 'Anything you’d like to share? All optional.',
  'onboarding.optional_job': 'Favourite job',
  'onboarding.optional_expansion': 'Favourite expansion',
  'onboarding.optional_anime': 'Favourite anime',
  'onboarding.optional_movie': 'Favourite movie',
  'onboarding.optional_character': 'Favourite FF character',
  'onboarding.optional_location': 'Favourite location',
  'onboarding.optional_location_none': '(None)',
  'onboarding.filters_intro': 'Who would you like to see?',
  'onboarding.filters_any': 'Anyone',
  'onboarding.preferences_intro': 'Choose your look.',
  'onboarding.preferences_theme': 'Theme',
  'onboarding.preferences_size': 'Size',
  'onboarding.finished_title': 'You’re all set!',
  'onboarding.finished_body': 'Time to find your match.',
  'onboarding.could_not_assemble': 'Could not assemble {0}: {1}',

  // ---- Deck ----
  'deck.empty_title': 'No more cards',
  'deck.empty_body': 'New profiles arrive soon.',
  'deck.next_pull': 'Next batch in {0}',
  'deck.no_pool': 'No one matches your filters yet. Try widening them in settings.',
  'deck.pass': 'Pass',
  'deck.like': 'Like',
  'deck.view_profile': 'View profile',
  'deck.match_congratulations': 'Congratulations',
  'deck.match_its_a_match': 'It’s a match!',
  'deck.match_you': 'You',
  'deck.match_your_match': 'Your match',
  'deck.match_send_message': 'Send a message',
  'deck.match_keep_swiping': 'Keep swiping',

  // ---- Chat list ----
  'chatlist.title': 'Matches',
  'chatlist.empty': 'No matches yet. Keep swiping!',
  'chatlist.unread_one': '1 new message',
  'chatlist.unread_many': '{0} new messages',
  'chatlist.no_messages': 'Say hi!',
  'chatlist.pinned': 'Pinned',

  // ---- Chat ----
  'chat.placeholder': 'Message',
  'chat.send': 'Send',
  'chat.locked': 'Unlock your messages to read this conversation.',
  'chat.e2e_self_broken':
    'Your message encryption isn’t set up yet. Reconnect to finish setting up encryption before chatting.',
  'chat.read': 'Read',
  'chat.encrypted_note': 'Messages are end-to-end encrypted.',
  'chat.key_changed_toast': '⚠️ {0}’s security key changed.',
  'chat.key_changed_title': 'Security key changed',
  'chat.key_changed_body':
    'This contact’s encryption key is different from the one you saw before. This is expected if they reinstalled or switched devices — but it can also mean someone is intercepting your messages. Verify the new safety number with them before trusting it.',
  'chat.key_safety_number': 'New safety number: {0}',
  'chat.key_accept': 'I verified it — trust new key',

  // ---- Bottom nav ----
  'nav.deck': 'Discover',
  'nav.chats': 'Chats',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',

  // ---- Theme ----
  'theme.mode_light': 'Light',
  'theme.mode_dark': 'Dark',

  // ---- Settings ----
  'settings.title': 'Settings',
  'settings.section_appearance': 'Appearance',
  'settings.section_preferences': 'Preferences',
  'settings.section_privacy': 'Privacy',
  'settings.section_other': 'Other',
  'settings.section_danger_zone': 'Danger zone',
  'settings.theme': 'Theme',
  'settings.reduce_motion': 'Reduce motion',
  'settings.reduce_motion_hint': 'Minimise animations across the app.',
  'settings.sound_effects': 'Sound effects',
  'settings.sound_effects_hint': 'Play a sound on new matches and messages.',
  'settings.always_blur_nsfw': 'Always blur NSFW photos',
  'settings.always_blur_nsfw_hint': 'Blur adult imagery even where you have opted in.',
  'settings.nsfw_profile': 'Adult (NSFW) profile',
  'settings.nsfw_profile_hint':
    'Let your profile appear to players who have enabled adult content.',
  'settings.nsfw_profile_locked':
    'This stays on while you have adult roleplay selected or an NSFW photo.',
  'settings.nsfw_load_failed': 'Could not load your privacy settings.',
  'settings.send_feedback': 'Send feedback',
  'settings.terms_of_service': 'Terms of service',
  'settings.contributors': 'Contributors',
  'settings.back': 'Back',
  'settings.back_to_settings': 'Back to settings',

  // Warnings
  'settings.warnings_button': 'View warnings ({0})',
  'settings.warnings_button_unseen': 'View warnings ({0} new of {1})',
  'settings.warnings_title': 'Warnings',
  'settings.no_warnings': 'No warnings on your account.',
  'settings.modmsg_button': 'Moderator messages',
  'settings.modmsg_button_unseen': 'Moderator messages ({0} new)',
  'settings.modmsg_title': 'Moderator messages',
  'settings.no_modmsg': 'No messages from the moderation team.',

  // Feedback
  'settings.feedback_intro': 'Found a bug or have an idea? Tell us.',
  'settings.feedback_note': 'Please don’t include personal information.',
  'settings.feedback_type': 'Type',
  'settings.feedback_kind_bug': 'Bug',
  'settings.feedback_kind_improvement': 'Improvement',
  'settings.feedback_kind_other': 'Other',
  'settings.feedback_message': 'Your message',
  'settings.feedback_submit': 'Send',
  'settings.feedback_sending': 'Sending…',
  'settings.feedback_thanks': 'Thanks — your feedback has been sent.',
  'settings.feedback_failed': 'Could not send feedback. Please try again.',

  // Contributors
  'settings.contributors_title': 'Made with love',
  'settings.contributors_intro': 'AetherLove is built and run by volunteers.',

  // Delete account
  'settings.delete_account': 'Delete account',
  'settings.delete_warning_intro': 'Deleting your account is permanent. This removes:',
  'settings.delete_bullet_account': 'Your account and sign-in',
  'settings.delete_bullet_matches': 'All matches and conversations',
  'settings.delete_bullet_preferences': 'Your profile and preferences',
  'settings.delete_bullet_pictures': 'All uploaded photos',
  'settings.delete_reregister': 'You can register again later, but nothing here can be recovered.',
  'settings.delete_confirm': 'Delete account',
  'settings.deleting_title': 'Deleting your account',
  'settings.deleting_body': 'This will only take a moment',
  'settings.deleted_title': 'Account deleted',
  'settings.deleted_body': 'Your account and all its data have been removed.',
  'settings.create_new_profile': 'Create a new profile',
  'settings.delete_failed': 'Could not delete your account: {0}',

  // ---- My profile ----
  'profile.title': 'My profile',
  'profile.tab_view': 'View',
  'profile.tab_edit': 'Edit',
  'profile.load_failed': 'Could not load your profile: {0}',
  'profile.retry': 'Retry',
  'profile.save_changes': 'Save changes',
  'profile.saving': 'Saving…',
  'profile.saved': 'Saved',
  'profile.save_failed': 'Could not save your profile: {0}',
  'profile.no_bio': 'No bio yet.',
  'profile.section_about': 'About',
  'profile.section_character': 'Character',
  'profile.section_languages': 'Languages',
  'profile.section_looking_for': 'Looking for',
  'profile.section_interests': 'Interests',
  'profile.section_favourites': 'Favourites',
  'profile.section_photos': 'Photos',
  'profile.fav_job': 'Job',
  'profile.fav_expansion': 'Expansion',
  'profile.fav_anime': 'Anime',
  'profile.fav_movie': 'Movie',
  'profile.fav_character': 'FF character',

  // Lifecycle / terminal screens (ported from Localization.Common.cs; plugin-specific wording adapted
  // to the web client).
  'common.try_again': 'Try Again',
  'common.i_understand': 'I understand',
  'common.sign_out': 'Sign out',
  'common.unlock': 'Unlock',
  'common.unlocking': 'Unlocking…',
  'common.acknowledging': 'Acknowledging…',
  'common.server_unreachable_detail': "Couldn't reach the server: {0}",
  'common.banned_title': 'Account banned',
  'common.banned_body':
    'Your AetherLove account has been banned. You can no longer use the service.',
  'common.banned_reason_label': 'Reason',
  'common.banned_uninstall_hint': 'You can close this tab at any time.',
  'common.outdated_title': 'Update required',
  'common.outdated_body':
    'You are using an outdated version of AetherLove. The server no longer supports this version, so it can’t connect.',
  'common.outdated_hint':
    'Please reload the page to get the latest version, then reopen AetherLove.',
  'common.offline_title': 'AetherLove is offline',
  'common.offline_body':
    "We can't reach the AetherLove servers right now. The app needs a live connection to browse, match, and chat, so it's paused until we're back online.",
  'common.offline_reconnecting': 'Reconnecting…',
  'common.offline_keep_trying': "We'll keep trying automatically.",
  'common.passphrase_title': 'Enter your encryption passphrase',
  'common.passphrase_intro':
    "We recognise this account, but this device doesn't have your chat key yet. Enter the passphrase you set on your first device to unlock your chat history.",
  'common.passphrase_forgot':
    'Forgot your passphrase? There is no recovery, but you can sign out below and create a fresh account. Your chat history with this account will be lost.',
  'common.passphrase_bundle_load_failed': "Couldn't load encryption bundle from server.",
  'common.passphrase_empty': 'Please enter your passphrase.',
  'common.passphrase_incorrect': 'Incorrect passphrase. Try again.',
  'common.passphrase_unlock_failed': 'Unlock failed: {0}',
  'common.warnings_heading_one': 'You have a moderation warning',
  'common.warnings_heading_many': 'You have {0} moderation warnings',
  'common.warnings_body':
    'Please read the following warning(s) from the moderation team. Repeat offenses can result in account suspension.',
  'common.warnings_submit_error': "Couldn't reach the server: {0}. Tap to retry.",
  'common.modmsg_heading_one': 'A message from the moderation team',
  'common.modmsg_heading_many': 'You have {0} messages from the moderation team',
  'common.modmsg_body': 'Please read the following message(s) from the moderation team.',
  'common.modmsg_got_it': 'Got it',
  'common.recovery_title': 'Set up message encryption',
  'common.recovery_intro':
    'Your account is active but has no encryption key yet. Choose a passphrase to set up end-to-end encryption so you can send and receive messages. Keep it safe — there is no recovery if you forget it.',
  'common.recovery_button': 'Set up encryption',
  'common.recovery_support':
    'If you previously had chats on this account, they cannot be recovered with a new key.',

  // ---- Photo moderation / upload ----
  'common.ok': 'OK',
  'common.use_this_crop': 'Use this crop',

  // SFW gate modal (avatar + main must be SFW)
  'common.sfw_gate_title': 'Profile + Avatar — SFW ONLY',
  'common.sfw_gate_subtitle': 'What is NOT SFW:',
  'common.sfw_gate_b1': 'Full nudity of any gender.',
  'common.sfw_gate_b2': 'Visible nipples of any gender.',
  'common.sfw_gate_b3': 'Visible pubic hair or genital areas.',
  'common.sfw_gate_b4': 'Graphic depictions of blood, injuries, wounds, or bodily harm.',
  'common.sfw_gate_b5':
    'Tattoos, markings, symbols, or text that are obscene, discriminatory, hateful, or target individuals or groups based on protected characteristics.',
  'common.sfw_gate_b6':
    'Sexual gestures, poses, or visual references that imply or simulate sexual acts.',
  'common.sfw_gate_secondary':
    'You can still upload NSFW material in your secondary profile images.',
  'common.sfw_gate_ack': 'I understand the rules for SFW',

  // NSFW declaration
  'common.nsfw_decl_unselected': '— select an option —',
  'common.nsfw_decl_sfw': 'this picture is SFW',
  'common.nsfw_decl_nsfw': 'this picture is NSFW',

  // Lalafell NSFW modal
  'common.lalafell_nsfw_title': 'NSFW not available',
  'common.lalafell_nsfw_body':
    "We do not allow NSFW pictures of Lalafell characters. Because Lalafells are child-like in appearance, we apply this policy uniformly to every Lalafell account and make no case-by-case exceptions.\n\nYour photo has been set back to SFW. If this photo isn't safe-for-work, please remove it and upload a different one.",

  // Undeclared photo modal
  'common.undeclared_photo_title': 'Declaration required',
  'common.undeclared_photo_body':
    'You must select whether your other picture is SFW or NSFW before uploading another.',

  // Image requirements modal
  'common.img_requirements_title': "Image can't be used",
  'common.img_invalid': "That file isn't a valid image, or its format isn't supported.",
  'common.img_too_small': 'That image is only {0}×{1} px, which is too small.',
  'common.img_requirements_sizes':
    'Avatars need at least {0}×{1} px and profile photos at least {2}×{3} px. Please choose a larger image.',

  // Image disclaimer step
  'onboarding.header_image_disclaimer': 'Photo guidelines',
  'onboarding.disclaimer_intro':
    'AetherLove is built for Final Fantasy XIV players. Before uploading any images, please read the following guidelines carefully.',
  'onboarding.disclaimer_moderation':
    'All uploads are subject to both automated and manual moderation.',
  'onboarding.disclaimer_general_body':
    'All images must depict your own Final Fantasy XIV character. Fan art, AI-generated images, real photos, and images unrelated to your character are not permitted.',
  'onboarding.disclaimer_sfw_body':
    'Your profile picture and main photo must be safe-for-work (SFW). Extra photos (slots 2–4) may be marked as adult content.',
  'onboarding.disclaimer_moderation_body':
    'Every image is automatically reviewed using AI moderation APIs and assessed by human staff. Violations result in image removal and may result in account action.',
  'onboarding.disclaimer_ack': 'I understand and agree',

  // Photo slot controls
  'photo.replace': 'Replace',
  'photo.remove': 'Remove',
  'photo.undo_remove': 'Undo',
  'photo.add': 'Add',

  // MyProfile images tab
  'profile.tab_images': 'Photos',
  'profile.images_avatar_section': 'Profile picture',
  'profile.images_avatar_desc':
    'Your profile picture is shown in the chat list and on match cards. Use a square close-up portrait of your FFXIV character.',
  'profile.images_photos_section': 'Profile photos',
  'profile.images_photos_desc':
    'Add portrait photos to your profile (10:16 ratio). The first slot is required; slots 2–4 are optional.',
  'profile.images_nsfw_section': 'Adult content',
  'profile.images_nsfw_toggle': 'Adult (NSFW) profile',
  'profile.images_nsfw_hint':
    'Required to appear in adult searches and to mark extra photos as NSFW.',
  'profile.images_nsfw_locked': 'Stays on while you have an NSFW photo or adult roleplay selected.',
  'profile.images_declare_first': 'Mark every extra photo as SFW or NSFW before saving.',
  'profile.images_save_failed': 'Could not save photos: {0}',
  'profile.images_load_failed': 'Could not load photos: {0}',
  'profile.main_must_be_sfw':
    'Your main profile picture MUST be SFW. Uploading an NSFW picture is grounds for account suspension or deletion.',
  'profile.sfw_or_nsfw': 'Is this picture SFW or NSFW?',
  'profile.sfw_mismatch_warning':
    'If our system detects you uploaded NSFW while SFW is selected, your photo will be held for moderation and you risk account suspension.',
  'profile.replace': 'Replace',
  'profile.remove': 'Remove',
  'profile.undo': 'Undo',
  'profile.currently_sfw': 'Currently: SFW',
  'profile.currently_nsfw': 'Currently: NSFW',
  'profile.new_photo_ready': 'New photo ready — not yet saved.',
  'profile.photo_will_be_removed': 'Photo will be removed.',

  'chat.matches_title': 'Matches',
  'chat.archive_title': 'Archived',
  'chat.menu_archive': 'Archive chat',
  'chat.menu_unarchive': 'Unarchive chat',
  'chat.no_archived': 'No archived chats',
  'chat.all_archived': 'All your chats are archived',

  'news.title': 'News',
  'news.empty': 'No news yet.',
  'news.unavailable': 'This announcement is no longer available.',
  'news.next': 'Next',
  'news.got_it': 'Got it',
  'news.back': '← Back',
  'news.load_error': "Couldn't load news: {0}",
  'news.progress': '{0} / {1}',
  'news.settings_button': 'News',
  'news.settings_button_unseen': 'News ({0} new)',

  // Peer profile (ported from Localization.Profile.cs).
  'profile.none_loaded': 'No profile loaded.',
  'profile.flairs': 'Flairs',
  'profile.nsfw_reveal': 'Click to show NSFW image',
  'profile.report_profile': 'Report profile',
  'profile.report_warning':
    'False or malicious reports lead to warnings on your own account, and repeated abuse can result in suspension. Only report profiles that actually violate the rules.',
  'profile.report_prompt': "Tell our moderators what's wrong with {0}:",
  'profile.report_agree': 'I understand false reports may result in warnings against my account.',
  'profile.report_thanks':
    "Thanks — our moderators will take a look. You won't see this profile again until you pull a fresh one from the deck.",
} as const;

export type StringKey = keyof typeof en;
