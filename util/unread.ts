/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ReadStateStore, useStateFromStores } from "@webpack/common";

import { useBookmarks } from "./store";
import { Bookmark } from "./types";

export interface BookmarkBadges {
    hasUnread: boolean;
    mentionCount: number;
}

/** Live unread/mention state for a single bookmark (channel bookmarks only) */
export function useBookmarkBadges(bookmark: Bookmark): BookmarkBadges {
    const channelId = bookmark.kind === "channel" ? bookmark.channelId : undefined;

    return useStateFromStores(
        [ReadStateStore],
        () => channelId
            ? {
                hasUnread: ReadStateStore.hasUnread(channelId),
                mentionCount: ReadStateStore.getMentionCount(channelId)
            }
            : { hasUnread: false, mentionCount: 0 },
        [channelId]
    );
}

/** Aggregate unread/mention state across all bookmarks (for the sidebar button) */
export function useTotalBadges(): BookmarkBadges {
    const bookmarks = useBookmarks();

    return useStateFromStores(
        [ReadStateStore],
        () => {
            let hasUnread = false;
            let mentionCount = 0;
            for (const bookmark of bookmarks) {
                if (bookmark.kind !== "channel" || !bookmark.channelId) continue;
                mentionCount += ReadStateStore.getMentionCount(bookmark.channelId);
                if (!hasUnread) hasUnread = ReadStateStore.hasUnread(bookmark.channelId);
            }
            return { hasUnread, mentionCount };
        },
        [bookmarks]
    );
}
