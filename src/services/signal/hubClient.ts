// Typed wrapper for the AetherLoveHub methods. Ports Services/Hub/AetherLoveHubClient.cs (the RPCs)
// plus the server→client push registrations from AetherSignalService.cs. Method names and argument
// order match the C# hub exactly — the server dispatches by method name.

import type {Language, MusicProvider, SwipeDirection} from '../../shared/enums';
import type {
    AccountBannedPushDto,
    AetherConnectionDto,
    BasicProfileDto,
    BlockedByPeerPushDto,
    ConversationHistoryDto,
    DebugInfoDto,
    DeckRefreshPushDto,
    FiltersDto,
    FlairDto,
    KeyBundleDto,
    MatchCreatedPushDto,
    MatchDeckDto,
    MatchListDto,
    MessageReadPushDto,
    MessageReceivedPushDto,
    ModeratorMessageIssuedPushDto,
    MusicLinkDto,
    NewsDto,
    NewsPublishedPushDto,
    NewsSummaryDto,
    NewsTestPushDto,
    OnboardingStateDto,
    PhotoBatchDto,
    ProfileDetailDto,
    PulseDto,
    ReportUserRequest,
    SendMessageRequest,
    SendMessageResponse,
    SubmitFeedbackRequest,
    SwipeResultDto,
    UnmatchedPushDto,
    WarningIssuedPushDto,
} from '../../shared/dtos';
import type {Guid} from '../../shared/wire';
import {AetherConnection, connection as defaultConnection} from './connection';

/** Server→client push payloads, keyed by hub event name. */
export interface HubEvents {
    MatchCreated: MatchCreatedPushDto;
    DeckRefresh: DeckRefreshPushDto;
    MessageReceived: MessageReceivedPushDto;
    MessageRead: MessageReadPushDto;
    Unmatched: UnmatchedPushDto;
    BlockedByPeer: BlockedByPeerPushDto;
    WarningIssued: WarningIssuedPushDto;
    ModeratorMessageIssued: ModeratorMessageIssuedPushDto;
    NewsPublished: NewsPublishedPushDto;
    NewsTestPush: NewsTestPushDto;
    AccountBanned: AccountBannedPushDto;
}

export class HubClient {
    constructor(private readonly conn: AetherConnection = defaultConnection) {
    }

    get isConnected(): boolean {
        return this.conn.isConnected;
    }

    /** Subscribe to a server push. Returns an unsubscribe handle. */
    on<E extends keyof HubEvents>(event: E, handler: (payload: HubEvents[E]) => void): void {
        this.conn.on(event, handler as (payload: unknown) => void);
    }

    // ---- Diagnostics ----
    getDebugInfo(): Promise<DebugInfoDto> {
        return this.invoke('GetDebugInfoAsync');
    }

    // ---- Profile / onboarding ----
    saveBasicProfile(dto: BasicProfileDto): Promise<void> {
        return this.send('SaveBasicProfileAsync', dto);
    }

    savePhotos(dto: PhotoBatchDto): Promise<void> {
        return this.send('SavePhotosAsync', dto);
    }

    saveFilters(dto: FiltersDto): Promise<void> {
        return this.send('SaveFiltersAsync', dto);
    }

    resolveMusicLink(provider: MusicProvider, rawInput: string): Promise<MusicLinkDto | null> {
        return this.invoke('ResolveMusicLinkAsync', provider, rawInput);
    }

    setProfileNsfw(enabled: boolean): Promise<void> {
        return this.send('SetProfileNsfwAsync', enabled);
    }

    getConnectionInfo(): Promise<AetherConnectionDto> {
        return this.invoke('GetConnectionInfoAsync');
    }

    getOnboardingState(): Promise<OnboardingStateDto> {
        return this.invoke('GetOnboardingStateAsync');
    }

    deletePhoto(order: number): Promise<void> {
        return this.send('DeletePhotoAsync', order);
    }

    deleteAccount(): Promise<void> {
        return this.send('DeleteAccountAsync');
    }

    getProfileDetail(peerId: Guid): Promise<ProfileDetailDto> {
        return this.invoke('GetProfileDetailAsync', peerId);
    }

    getMyProfileDetail(): Promise<ProfileDetailDto> {
        return this.invoke('GetMyProfileDetailAsync');
    }

    // ---- Warnings ----
    markWarningsSeen(warningIds: Guid[]): Promise<void> {
        return this.send('MarkWarningsSeenAsync', warningIds);
    }

    // ---- Moderator messages ----
    markModeratorMessagesSeen(messageIds: Guid[]): Promise<void> {
        return this.send('MarkModeratorMessagesSeenAsync', messageIds);
    }

    // ---- News ----
    getNews(newsId: Guid): Promise<NewsDto | null> {
        return this.invoke('GetNewsAsync', newsId);
    }

    getNewsPreview(newsId: Guid): Promise<NewsDto | null> {
        return this.invoke('GetNewsPreviewAsync', newsId);
    }

    getNewsList(): Promise<NewsSummaryDto[]> {
        return this.invoke('GetNewsListAsync');
    }

    markNewsSeen(newsIds: Guid[]): Promise<void> {
        return this.send('MarkNewsSeenAsync', newsIds);
    }

    // ---- Matching / deck ----
    getMatchDeck(): Promise<MatchDeckDto> {
        return this.invoke('GetMatchDeckAsync');
    }

    swipe(targetProfileId: Guid, direction: SwipeDirection): Promise<SwipeResultDto> {
        return this.invoke('SwipeAsync', targetProfileId, direction);
    }

    markMatchListSeen(): Promise<void> {
        return this.send('MarkMatchListSeenAsync');
    }

    getMyMatches(): Promise<MatchListDto> {
        return this.invoke('GetMyMatchesAsync');
    }

    unmatch(peerId: Guid): Promise<void> {
        return this.send('UnmatchAsync', peerId);
    }

    blockUser(peerId: Guid): Promise<void> {
        return this.send('BlockUserAsync', peerId);
    }

    setMatchPinned(peerId: Guid, pinned: boolean): Promise<void> {
        return this.send('SetMatchPinnedAsync', peerId, pinned);
    }

    // ---- E2E messaging keys ----
    uploadKeyBundle(dto: KeyBundleDto): Promise<void> {
        return this.send('UploadKeyBundleAsync', dto);
    }

    getMyKeyBundle(): Promise<KeyBundleDto | null> {
        return this.invoke('GetMyKeyBundleAsync');
    }

    getPeerPublicKey(peerId: Guid): Promise<Uint8Array | null> {
        return this.invoke('GetPeerPublicKeyAsync', peerId);
    }

    // ---- Messaging ----
    sendMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
        return this.invoke('SendMessageAsync', req);
    }

    getConversation(peerId: Guid): Promise<ConversationHistoryDto> {
        return this.invoke('GetConversationAsync', peerId);
    }

    markConversationRead(peerId: Guid): Promise<Guid[]> {
        return this.invoke('MarkConversationReadAsync', peerId);
    }

    // ---- Flairs ----
    getFlairCatalog(): Promise<FlairDto[]> {
        return this.invoke('GetFlairCatalogAsync');
    }

    // ---- Moderation / feedback ----
    reportUser(req: ReportUserRequest): Promise<Guid> {
        return this.invoke('ReportUserAsync', req);
    }

    submitFeedback(req: SubmitFeedbackRequest): Promise<Guid> {
        return this.invoke('SubmitFeedbackAsync', req);
    }

    // ---- Pulse ----
    getPulse(language: Language): Promise<PulseDto | null> {
        return this.invoke('GetPulseAsync', language);
    }

    private async invoke<T>(method: string, ...args: unknown[]): Promise<T> {
        await this.conn.ensureConnected();
        return this.conn.requireConnection().invoke<T>(method, ...args);
    }

    private async send(method: string, ...args: unknown[]): Promise<void> {
        await this.conn.ensureConnected();
        await this.conn.requireConnection().invoke(method, ...args);
    }
}

export const hubClient = new HubClient();
