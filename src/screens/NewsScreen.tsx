// Web port of Screens/NewsScreen.cs. Two modes:
//  - unseen queue (startup gate): when the connection snapshot carries UnseenNews, step through each
//    article ("Next" / "Got it"), marking each seen, then continue to the deck.
//  - list (from Settings): articles grouped by day; tap one to read it, back returns to the list.

import {useEffect, useMemo, useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {resolveNextScreen, sessionStore} from '../state/session';
import {useStore} from '../state/hooks';
import {router, Screen} from '../app/router';
import type {NewsDto, NewsSummaryDto} from '../shared/dtos';
import {useT} from '../i18n/useT';
import {Button, LoadingSpinner} from '../ui/components';
import {NewsBody} from '../ui/NewsBody';

type View = 'loading' | 'queue' | 'list' | 'article' | 'empty' | 'error';

function markSeen(id: string): void {
    void hubClient.markNewsSeen([id]).catch(() => undefined);
    sessionStore.update((s) =>
        s.connection
            ? {
                ...s,
                connection: {
                    ...s.connection,
                    UnseenNews: s.connection.UnseenNews.filter((n) => n.Id !== id),
                },
            }
            : s
    );
}

export function NewsScreen() {
    const t = useT();
    const session = useStore(sessionStore);
    // Snapshot the unseen queue once on mount (markSeen mutates the store as we go).
    const unseen = useMemo(() => session.connection?.UnseenNews ?? [], []); // eslint-disable-line react-hooks/exhaustive-deps

    const [view, setView] = useState<View>('loading');
    const [error, setError] = useState<string | null>(null);
    const [list, setList] = useState<NewsSummaryDto[]>([]);
    const [entry, setEntry] = useState<NewsDto | null>(null);
    const [queueIdx, setQueueIdx] = useState(0);

    // Initial route: unseen queue if the snapshot has unseen items, otherwise the full list.
    useEffect(() => {
        if (unseen.length > 0) {
            setView('queue');
            void openArticle(unseen[0].Id, 'queue');
        } else {
            void loadList();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadList() {
        setView('loading');
        try {
            const items = await hubClient.getNewsList();
            setList(items);
            setView(items.length === 0 ? 'empty' : 'list');
        } catch (e) {
            setError(String((e as Error)?.message ?? e));
            setView('error');
        }
    }

    async function openArticle(id: string, mode: 'queue' | 'article') {
        try {
            const dto = await hubClient.getNews(id);
            setEntry(dto);
            setView(mode);
        } catch (e) {
            setError(String((e as Error)?.message ?? e));
            setView('error');
        }
    }

    // Queue advance: mark current seen, step to the next unseen article or leave to the deck.
    function advanceQueue() {
        const cur = unseen[queueIdx];
        if (cur) markSeen(cur.Id);
        const next = queueIdx + 1;
        if (next < unseen.length) {
            setQueueIdx(next);
            setView('loading');
            void openArticle(unseen[next].Id, 'queue');
        } else {
            router.navigate(resolveNextScreen() === Screen.News ? Screen.Deck : resolveNextScreen());
        }
    }

    function Heading() {
        return (
            <h1 className="mb-4 font-display text-3xl font-extrabold tracking-tight text-strong">
                {t('news.title')}
            </h1>
        );
    }

    if (view === 'loading') {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingSpinner size={26} className="text-accent"/>
            </div>
        );
    }

    if (view === 'empty' || view === 'error') {
        return (
            <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-10">
                <Heading/>
                <p className="text-[14px] text-subtle">
                    {view === 'empty' ? t('news.empty') : t('news.load_error', error ?? '')}
                </p>
                <Button
                    variant="ghost"
                    className="mt-4 self-start"
                    onClick={() => router.navigate(Screen.Deck)}
                >
                    {t('news.back')}
                </Button>
            </div>
        );
    }

    if (view === 'list') {
        const byDay = new Map<string, NewsSummaryDto[]>();
        for (const n of [...list].sort(
            (a, b) => Date.parse(b.PublishedAtUtc) - Date.parse(a.PublishedAtUtc)
        )) {
            const day = new Date(n.PublishedAtUtc).toLocaleDateString();
            (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(n);
        }
        return (
            <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-10">
                <Heading/>
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-6">
                    {[...byDay.entries()].map(([day, items]) => (
                        <div key={day}>
                            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                                {day}
                            </p>
                            <ul className="space-y-1">
                                {items.map((n) => (
                                    <li key={n.Id}>
                                        <button
                                            onClick={() => {
                                                setView('loading');
                                                void openArticle(n.Id, 'article');
                                            }}
                                            className="w-full rounded-xl px-3 py-2.5 text-left text-[15px] text-body transition-colors hover:bg-surface/5"
                                        >
                                            {n.Title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 'queue' | 'article' — an open article.
    const total = unseen.length;
    const isQueue = view === 'queue';
    const label = isQueue && queueIdx < total - 1 ? t('news.next') : t('news.got_it');
    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-10">
            <h1 className="font-display text-2xl font-bold text-strong">
                {entry?.Title ?? t('news.unavailable')}
            </h1>
            <div className="my-4 min-h-0 flex-1 overflow-y-auto">
                {entry ? (
                    <NewsBody lines={entry.Lines}/>
                ) : (
                    <p className="text-[14px] text-subtle">{t('news.unavailable')}</p>
                )}
            </div>
            <div className="flex items-center justify-between pb-6">
                {isQueue ? (
                    <>
                        {total > 1 && (
                            <span className="font-mono text-[12px] text-muted">
                {t('news.progress', queueIdx + 1, total)}
              </span>
                        )}
                        <Button className="ml-auto" onClick={advanceQueue}>
                            {label}
                        </Button>
                    </>
                ) : (
                    <Button variant="ghost" onClick={() => void loadList()}>
                        {t('news.back')}
                    </Button>
                )}
            </div>
        </div>
    );
}
