// 1:1 port of AetherLove.Shared DTOs. Field names are PascalCase to match the C# records'
// MessagePack keyAsPropertyName wire contract — do not rename without changing the server.

import type {Bytes, DateTimeOffset, Guid} from './wire';
import type {
    ContentInterest,
    Expansion,
    FeedbackKind,
    Gender,
    Job,
    Language,
    LookingFor,
    MusicProvider,
    NewsLineKind,
    NewsStatus,
    ProfileLifecycle,
    Race,
    Region,
    SyncTool,
} from './enums';

// ---- Auth (REST/JSON, not hub) ----------------------------------------------------------

export interface TokenPairDto {
    AccessToken: string;
    AccessTokenExpiresAtUtc: DateTimeOffset;
    RefreshToken: string;
    RefreshTokenExpiresAtUtc: DateTimeOffset;
}

export interface LoginStartRequest {
    DeviceName: string | null;
}

export interface LoginStartResponse {
    TransactionId: Guid;
    TransactionSecret: string;
    LoginUrl: string;
    ExpiresAtUtc: DateTimeOffset;
}

export interface LoginPollRequest {
    TransactionId: Guid;
    TransactionSecret: string;
}

/** Status is one of "pending" | "completed" | "failed". */
export interface LoginPollResponse {
    Status: string;
    Tokens?: TokenPairDto | null;
    Error?: string | null;
}

export interface RefreshRequest {
    RefreshToken: string;
}

// ---- Profile ----------------------------------------------------------------------------

export interface BasicProfileDto {
    DisplayName: string;
    Bio: string;
    Race: Race;
    Gender: Gender;
    Region: Region;
    LanguageMask: Language;
    ContentInterestMask: ContentInterest;
    LookingForMask: LookingFor;
    NsfwEnabled: boolean;
    Timezone: string;
    FavoriteJob: Job;
    FavoriteExpansion: Expansion;
    SpotifyTrackId: string;
    SpotifyTrackName: string;
    SoundCloudUrl: string;
    SoundCloudName: string;
    AppleMusicUrl: string;
    AppleMusicName: string;
    YouTubeMusicUrl: string;
    YouTubeMusicName: string;
    FavoriteMovie: string;
    FavoriteAnime: string;
    FavoriteFFCharacter: string;
    WeekdayHoursMask: number;
    WeekendHoursMask: number;
    SyncTool: SyncTool;
}

export interface FiltersDto {
    WantedRaceMask: Race;
    WantedGenderMask: Gender;
    WantedRegionMask: Region;
    WantedLanguageMask: Language;
}

export interface PhotoUploadDto {
    Base64: string;
    CropX: number;
    CropY: number;
    CropWidth: number;
    CropHeight: number;
    IsNsfw: boolean;
}

export interface PhotoBatchDto {
    Avatar: PhotoUploadDto | null;
    Main: PhotoUploadDto | null;
    Extra1: PhotoUploadDto | null;
    Extra2: PhotoUploadDto | null;
    Extra3: PhotoUploadDto | null;
}

export interface MusicLinkDto {
    Provider: MusicProvider;
    Ref: string;
    Name: string;
}

export interface ProfilePhotoDto {
    Order: number;
    IsNsfw: boolean;
    WebpBytes: Bytes;
}

export interface ProfileDetailDto {
    ProfileId: Guid;
    DisplayName: string;
    Bio: string;
    Race: Race;
    Gender: Gender;
    Region: Region;
    LanguageMask: Language;
    ContentInterestMask: ContentInterest;
    LookingForMask: LookingFor;
    NsfwEnabled: boolean;
    IsNsfw: boolean;
    TimezoneOffsetMinutes: number;
    FavoriteJob: Job;
    FavoriteExpansion: Expansion;
    FavoriteLocationName: string;
    SpotifyTrackId: string;
    SpotifyTrackName: string;
    SoundCloudUrl: string;
    SoundCloudName: string;
    AppleMusicUrl: string;
    AppleMusicName: string;
    YouTubeMusicUrl: string;
    YouTubeMusicName: string;
    FavoriteMovie: string;
    FavoriteAnime: string;
    FavoriteFFCharacter: string;
    WeekdayHoursMask: number;
    WeekendHoursMask: number;
    SyncTool: SyncTool;
    Photos: ProfilePhotoDto[];
    FlairIds: Guid[];
}

export interface WarningDto {
    Id: Guid;
    Reason: string;
    Seen: boolean;
    CreatedAtUtc: DateTimeOffset;
}

export interface AetherConnectionDto {
    Status: ProfileLifecycle;
    DisplayName: string;
    BanReason: string | null;
    ModerationNotes: string | null;
    Warnings: WarningDto[];
    NewMatchCount: number;
    HasKeyBundle: boolean;
    UnseenNews: NewsSummaryDto[];
}

export interface OnboardingPhotoDto {
    Order: number;
    IsNsfw: boolean;
    WebpBytes: Bytes;
}

export interface OnboardingStateDto {
    Basic: BasicProfileDto;
    Filters: FiltersDto;
    Photos: OnboardingPhotoDto[];
}

// ---- Matching ---------------------------------------------------------------------------

export interface DeckCardDto {
    ProfileId: Guid;
    DisplayName: string;
    Bio: string;
    Race: Race;
    Gender: Gender;
    Region: Region;
    LookingForMask: LookingFor;
    ContentInterestMask: ContentInterest;
    AvatarWebp: Bytes;
    PortraitWebp: Bytes;
    FlairIds: Guid[];
}

export interface MatchDeckDto {
    Cards: DeckCardDto[];
    NextPullAtUtc: DateTimeOffset;
    RemainingInSlot: number;
    NoPoolForPreferences: boolean;
}

export interface SwipeResultDto {
    IsMatch: boolean;
    MatchedProfileId: Guid | null;
}

export interface MatchCreatedPushDto {
    MatchId: Guid;
    OtherProfileId: Guid;
    OtherDisplayName: string;
    CreatedAtUtc: DateTimeOffset;
}

export interface DeckRefreshPushDto {
    Reason: string;
}

// ---- Messaging --------------------------------------------------------------------------

export interface KeyBundleDto {
    PublicKey: Bytes;
    EncryptedPrivateKey: Bytes;
    KdfSalt: Bytes;
    KdfMemoryKb: number;
    KdfIterations: number;
    KdfParallelism: number;
    WrapNonce: Bytes;
}

export interface EncryptedMessageDto {
    Id: Guid;
    SenderProfileId: Guid;
    Ciphertext: Bytes;
    Nonce: Bytes;
    CreatedAtUtc: DateTimeOffset;
    ReadByOtherAtUtc: DateTimeOffset | null;
}

export interface ConversationHistoryDto {
    PeerProfileId: Guid;
    PeerPublicKey: Bytes;
    Messages: EncryptedMessageDto[];
}

export interface SendMessageRequest {
    PeerProfileId: Guid;
    Ciphertext: Bytes;
    Nonce: Bytes;
}

export interface SendMessageResponse {
    MessageId: Guid;
    CreatedAtUtc: DateTimeOffset;
}

export interface MessageReceivedPushDto {
    MessageId: Guid;
    FromProfileId: Guid;
    Ciphertext: Bytes;
    Nonce: Bytes;
    CreatedAtUtc: DateTimeOffset;
}

export interface MessageReadPushDto {
    ByProfileId: Guid;
    ReadAtUtc: DateTimeOffset;
    MessageIds: Guid[];
}

export interface UnmatchedPushDto {
    OtherProfileId: Guid;
}

export interface BlockedByPeerPushDto {
    OtherProfileId: Guid;
}

export interface MatchSummaryDto {
    PeerProfileId: Guid;
    PeerDisplayName: string;
    PeerAvatarWebp: Bytes;
    PeerPublicKey: Bytes;
    MatchedAtUtc: DateTimeOffset;
    LastMessageAtUtc: DateTimeOffset | null;
    LastMessageCiphertext: Bytes;
    LastMessageNonce: Bytes;
    LastMessageFromMe: boolean;
    UnreadCount: number;
    IsPinned: boolean;
}

export interface MatchListDto {
    Matches: MatchSummaryDto[];
}

// ---- Flairs -----------------------------------------------------------------------------

export interface FlairDto {
    Id: Guid;
    BackgroundColor: string;
    TextEnglish: string;
    TextSpanish: string | null;
    TextFrench: string | null;
    TextRussian: string | null;
    TextGerman: string | null;
    TextPortuguese: string | null;
    DescriptionEnglish: string;
    DescriptionSpanish: string | null;
    DescriptionFrench: string | null;
    DescriptionRussian: string | null;
    DescriptionGerman: string | null;
    DescriptionPortuguese: string | null;
}

// ---- Pulse ------------------------------------------------------------------------------

export interface PulseDto {
    Text: string;
}

// ---- Feedback ---------------------------------------------------------------------------

export interface SubmitFeedbackRequest {
    Kind: FeedbackKind;
    Message: string;
}

// ---- Moderation -------------------------------------------------------------------------

export interface ConversationSnapshotEntry {
    FromMe: boolean;
    Text: string;
    SentAtUtc: DateTimeOffset;
}

export interface ReportUserRequest {
    ReportedProfileId: Guid;
    Reason: string;
    IncludeConversation: boolean;
    ConversationSnapshot: ConversationSnapshotEntry[] | null;
}

export interface WarningIssuedPushDto {
    Warning: WarningDto;
}

export interface AccountBannedPushDto {
    Reason: string | null;
}

// ---- News -------------------------------------------------------------------------------

export interface NewsSummaryDto {
    Id: Guid;
    Title: string;
    Language: Language;
    PublishedAtUtc: DateTimeOffset;
}

export interface NewsLineDto {
    Kind: NewsLineKind;
    Text: string | null;
    ImageBytes: Bytes | null;
    Width: number | null;
    Height: number | null;
}

export interface NewsDto {
    Id: Guid;
    Title: string;
    Language: Language;
    Status: NewsStatus;
    PublishedAtUtc: DateTimeOffset | null;
    Lines: NewsLineDto[];
}

export interface NewsPublishedPushDto {
    Summary: NewsSummaryDto;
}

export interface NewsTestPushDto {
    Summary: NewsSummaryDto;
}

// ---- Diagnostics ------------------------------------------------------------------------

export interface DebugInfoDto {
    PartialAccountId: string;
    IpAddress: string;
    Transport: string;
    ServerTimeUtc: DateTimeOffset;
    SampleJpeg: Bytes;
    SampleWebp: Bytes;
}
