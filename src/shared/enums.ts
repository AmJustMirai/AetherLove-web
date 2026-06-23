// 1:1 port of AetherLove.Shared.Profile.Enums (+ a few cross-cutting enums). Numeric values MUST
// match the C# definitions exactly — they ride the MessagePack wire as integers. [Flags] enums are
// bitmasks; use the bitwise helpers at the bottom.

/** FFXIV jobs. Values are Lumina ClassJob row IDs; None is the unset sentinel. */
export enum Job {
  None = 0,
  Paladin = 19,
  Warrior = 21,
  DarkKnight = 32,
  Gunbreaker = 37,
  WhiteMage = 24,
  Scholar = 28,
  Astrologian = 33,
  Sage = 40,
  Monk = 20,
  Dragoon = 22,
  Ninja = 30,
  Samurai = 34,
  Reaper = 39,
  Viper = 41,
  Bard = 23,
  Machinist = 31,
  Dancer = 38,
  BlackMage = 25,
  Summoner = 27,
  RedMage = 35,
  Pictomancer = 42,
  BlueMage = 36,
  Carpenter = 8,
  Blacksmith = 9,
  Armorer = 10,
  Goldsmith = 11,
  Leatherworker = 12,
  Weaver = 13,
  Alchemist = 14,
  Culinarian = 15,
  Miner = 16,
  Botanist = 17,
  Fisher = 18,
}

export enum Expansion {
  None = 0,
  ARealmReborn = 1,
  Heavensward = 2,
  Stormblood = 3,
  Shadowbringers = 4,
  Endwalker = 5,
  Dawntrail = 6,
}

/** [Flags] */
export enum Gender {
  None = 0,
  Male = 1,
  Female = 2,
  Other = 4,
}

/** [Flags] */
export enum Race {
  None = 0,
  Hyur = 1,
  Elezen = 2,
  Lalafell = 4,
  Miqote = 8,
  Roegadyn = 16,
  AuRa = 32,
  Hrothgar = 64,
  Viera = 128,
}

/** [Flags] */
export enum Region {
  NorthAmerica = 1,
  Europe = 2,
  Oceania = 4,
  Japan = 8,
  PreferNotToSay = 16,
}

/** [Flags] */
export enum Language {
  English = 1,
  Spanish = 2,
  French = 4,
  Russian = 8,
  German = 16,
  Portuguese = 32,
}

/** [Flags] */
export enum LookingFor {
  Chatting = 1,
  InGameRomance = 2,
  LongTermRelationship = 4,
  RoleplayPartners = 8,
  CasualPlayBuddies = 16,
  GposeAndGlamour = 32,
  /** Adult roleplay. Picking this forces NsfwEnabled on. */
  Erp = 64,
}

/** [Flags] */
export enum ContentInterest {
  Roulettes = 1,
  Pvp = 2,
  RegularContent = 4,
  BlueMage = 8,
  ExtremeTrials = 16,
  TreasureHunts = 32,
  SavageRaiding = 64,
  CraftingAndGathering = 128,
  Fishing = 256,
  ClubVenues = 512,
  Gpose = 1024,
  AchievementHunting = 2048,
  Mahjong = 4096,
  Housing = 8192,
  MusicAndBard = 16384,
  RoleplayingVenues = 32768,
  TripleTriad = 65536,
  StoryAndLore = 131072,
}

/** [Flags] */
export enum SyncTool {
  None = 0,
  Lightless = 1,
  PlayerSync = 2,
  HonseFarm = 4,
  Snowcloak = 8,
}

export enum MusicProvider {
  None = 0,
  Spotify = 1,
  SoundCloud = 2,
  AppleMusic = 3,
  YouTubeMusic = 4,
}

export enum SwipeDirection {
  Pass = 1,
  Like = 2,
}

/** Mirror of the server's ProfileStatus. */
export enum ProfileLifecycle {
  Onboarding = 0,
  Active = 1,
  ShadowBanned = 2,
  Banned = 3,
  Deleted = 4,
}

export enum FeedbackKind {
  Bug = 0,
  Improvement = 1,
  Other = 2,
}

export enum NewsStatus {
  Draft = 0,
  Published = 1,
  Archived = 2,
}

export enum NewsLineKind {
  Text = 0,
  Image = 1,
}

// ---- [Flags] bitmask helpers -------------------------------------------------------------

export type FlagEnum = number;

export const hasFlag = (mask: FlagEnum, flag: FlagEnum): boolean => (mask & flag) === flag;
export const withFlag = (mask: FlagEnum, flag: FlagEnum): FlagEnum => mask | flag;
export const withoutFlag = (mask: FlagEnum, flag: FlagEnum): FlagEnum => mask & ~flag;
export const toggleFlag = (mask: FlagEnum, flag: FlagEnum): FlagEnum => mask ^ flag;
