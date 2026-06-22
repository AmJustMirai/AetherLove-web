// English display labels + ordered value lists for the profile enums, used by the onboarding form, the
// deck card, and the profile screens. Labels live here (not in the i18n catalog) because they map 1:1 to
// enum members; a later i18n batch can swap these for translate() calls if the other languages need them.

import {ContentInterest, Expansion, Gender, Job, Language, LookingFor, Race, Region, SyncTool,} from './enums';

export interface Option<T> {
    value: T;
    label: string;
}

export const RACE_OPTIONS: Option<Race>[] = [
    {value: Race.Hyur, label: 'Hyur'},
    {value: Race.Elezen, label: 'Elezen'},
    {value: Race.Lalafell, label: 'Lalafell'},
    {value: Race.Miqote, label: "Miqo'te"},
    {value: Race.Roegadyn, label: 'Roegadyn'},
    {value: Race.AuRa, label: 'Au Ra'},
    {value: Race.Hrothgar, label: 'Hrothgar'},
    {value: Race.Viera, label: 'Viera'},
];

export const GENDER_OPTIONS: Option<Gender>[] = [
    {value: Gender.Male, label: 'Male'},
    {value: Gender.Female, label: 'Female'},
    {value: Gender.Other, label: 'Other'},
];

export const REGION_OPTIONS: Option<Region>[] = [
    {value: Region.NorthAmerica, label: 'North America'},
    {value: Region.Europe, label: 'Europe'},
    {value: Region.Oceania, label: 'Oceania'},
    {value: Region.Japan, label: 'Japan'},
    {value: Region.PreferNotToSay, label: 'Prefer not to say'},
];

export const LANGUAGE_OPTIONS: Option<Language>[] = [
    {value: Language.English, label: 'English'},
    {value: Language.Spanish, label: 'Español'},
    {value: Language.French, label: 'Français'},
    {value: Language.Russian, label: 'Русский'},
    {value: Language.German, label: 'Deutsch'},
    {value: Language.Portuguese, label: 'Português'},
];

export const LOOKING_FOR_OPTIONS: Option<LookingFor>[] = [
    {value: LookingFor.Chatting, label: 'Chatting'},
    {value: LookingFor.InGameRomance, label: 'In-game romance'},
    {value: LookingFor.LongTermRelationship, label: 'Long-term relationship'},
    {value: LookingFor.RoleplayPartners, label: 'Roleplay partners'},
    {value: LookingFor.CasualPlayBuddies, label: 'Casual play buddies'},
    {value: LookingFor.GposeAndGlamour, label: 'GPose & glamour'},
    {value: LookingFor.Erp, label: 'Adult roleplay (ERP)'},
];

export const CONTENT_OPTIONS: Option<ContentInterest>[] = [
    {value: ContentInterest.Roulettes, label: 'Roulettes'},
    {value: ContentInterest.Pvp, label: 'PvP'},
    {value: ContentInterest.RegularContent, label: 'Regular content'},
    {value: ContentInterest.ExtremeTrials, label: 'Extreme trials'},
    {value: ContentInterest.SavageRaiding, label: 'Savage raiding'},
    {value: ContentInterest.TreasureHunts, label: 'Treasure hunts'},
    {value: ContentInterest.CraftingAndGathering, label: 'Crafting & gathering'},
    {value: ContentInterest.Fishing, label: 'Fishing'},
    {value: ContentInterest.ClubVenues, label: 'Club venues'},
    {value: ContentInterest.Gpose, label: 'GPose'},
    {value: ContentInterest.AchievementHunting, label: 'Achievements'},
    {value: ContentInterest.Mahjong, label: 'Mahjong'},
    {value: ContentInterest.Housing, label: 'Housing'},
    {value: ContentInterest.MusicAndBard, label: 'Music & bard'},
    {value: ContentInterest.RoleplayingVenues, label: 'RP venues'},
    {value: ContentInterest.TripleTriad, label: 'Triple Triad'},
    {value: ContentInterest.StoryAndLore, label: 'Story & lore'},
    {value: ContentInterest.BlueMage, label: 'Blue Mage'},
];

export const EXPANSION_OPTIONS: Option<Expansion>[] = [
    {value: Expansion.None, label: '—'},
    {value: Expansion.ARealmReborn, label: 'A Realm Reborn'},
    {value: Expansion.Heavensward, label: 'Heavensward'},
    {value: Expansion.Stormblood, label: 'Stormblood'},
    {value: Expansion.Shadowbringers, label: 'Shadowbringers'},
    {value: Expansion.Endwalker, label: 'Endwalker'},
    {value: Expansion.Dawntrail, label: 'Dawntrail'},
];

export const JOB_OPTIONS: Option<Job>[] = [
    {value: Job.None, label: '—'},
    {value: Job.Paladin, label: 'Paladin'},
    {value: Job.Warrior, label: 'Warrior'},
    {value: Job.DarkKnight, label: 'Dark Knight'},
    {value: Job.Gunbreaker, label: 'Gunbreaker'},
    {value: Job.WhiteMage, label: 'White Mage'},
    {value: Job.Scholar, label: 'Scholar'},
    {value: Job.Astrologian, label: 'Astrologian'},
    {value: Job.Sage, label: 'Sage'},
    {value: Job.Monk, label: 'Monk'},
    {value: Job.Dragoon, label: 'Dragoon'},
    {value: Job.Ninja, label: 'Ninja'},
    {value: Job.Samurai, label: 'Samurai'},
    {value: Job.Reaper, label: 'Reaper'},
    {value: Job.Viper, label: 'Viper'},
    {value: Job.Bard, label: 'Bard'},
    {value: Job.Machinist, label: 'Machinist'},
    {value: Job.Dancer, label: 'Dancer'},
    {value: Job.BlackMage, label: 'Black Mage'},
    {value: Job.Summoner, label: 'Summoner'},
    {value: Job.RedMage, label: 'Red Mage'},
    {value: Job.Pictomancer, label: 'Pictomancer'},
    {value: Job.BlueMage, label: 'Blue Mage'},
];

export const SYNC_TOOL_OPTIONS: Option<SyncTool>[] = [
    {value: SyncTool.Lightless, label: 'Lightless'},
    {value: SyncTool.PlayerSync, label: 'PlayerSync'},
    {value: SyncTool.HonseFarm, label: 'Honse Farm'},
    {value: SyncTool.Snowcloak, label: 'Snowcloak'},
];

/** Single-flag label lookup (deck card "Au Ra", etc.) for a value that is exactly one option. */
export function labelOf<T>(options: Option<T>[], value: T): string {
    return options.find((o) => o.value === value)?.label ?? '';
}

/** Joined labels for the set bits of a [Flags] mask (deck card looking-for line). */
export function maskLabels<T extends number>(options: Option<T>[], mask: number): string[] {
    return options.filter((o) => (mask & o.value) === o.value && o.value !== 0).map((o) => o.label);
}
