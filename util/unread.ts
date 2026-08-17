/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ReadStateStore, useStateFromStores } from "@webpack/common";

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
