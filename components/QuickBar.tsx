/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { FluxDispatcher, Tooltip, useEffect, useState } from "@webpack/common";

import { settings } from "../util/constants";
import { CheckIcon, PencilIcon, StarIcon, TrashIcon } from "../util/icons";
import { navigateToView } from "../util/navigation";
import { isViewBookmarked, removeBookmark, renameBookmark, toggleBookmark, useBookmarks } from "../util/store";
import { Bookmark, View } from "../util/types";
import { useBookmarkBadges } from "../util/unread";
import { bookmarkToView, getCurrentView, getViewName } from "../util/view";
import BookmarkIcon from "./BookmarkIcon";
import { openBookmarkMenu } from "./BookmarkMenu";

const cl = classNameFactory("vc-bookmarktabs-");

function QuickBarChip({ bookmark, editing, startRename, stopRename }: {
    bookmark: Bookmark;
    editing: boolean;
    startRename(): void;
    stopRename(): void;
}) {
    const [draft, setDraft] = useState(bookmark.name);

    const { unreadBadges } = settings.use(["unreadBadges"]);
    const badges = useBookmarkBadges(bookmark);

    const view = bookmarkToView(bookmark);
    const displayName = bookmark.name || getViewName(view);

    if (editing) {
        return (
            <div className={classes(cl("bar-chip"), cl("bar-chip-editing"))}>
                <input
                    className={cl("bar-input")}
                    value={draft}
                    placeholder={getViewName(view)}
                    autoFocus={true}
                    onChange={e => setDraft(e.target.value)}
                    onFocus={e => e.currentTarget.select()}
                    onBlur={() => {
                        void renameBookmark(bookmark.id, draft);
                        stopRename();
                    }}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            void renameBookmark(bookmark.id, draft);
                            stopRename();
                        } else if (e.key === "Escape") {
                            setDraft(bookmark.name);
                            stopRename();
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={cl("bar-chip")}
            role="button"
            tabIndex={0}
            onClick={() => navigateToView(view)}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateToView(view);
                }
            }}
            onContextMenu={e => openBookmarkMenu(e, {
                bookmark,
                view,
                onNavigate: () => void 0,
                onRename: startRename
            })}
        >
            <BookmarkIcon bookmark={bookmark} />
            <span className={cl("bar-chip-name")} title={displayName}>{displayName}</span>
            {unreadBadges && (
                badges.mentionCount > 0
                    ? <span className={classes(cl("bar-dot"), cl("bar-dot-mention"))} />
                    : badges.hasUnread
                        ? <span className={classes(cl("bar-dot"), cl("bar-dot-unread"))} />
                        : null
            )}
            <span className={cl("bar-chip-actions")}>
                <button
                    className={cl("bar-chip-action")}
                    aria-label="Rename bookmark"
                    onClick={e => {
                        e.stopPropagation();
                        setDraft(bookmark.name);
                        startRename();
                    }}
                >
                    <PencilIcon height={11} width={11} />
                </button>
                <button
                    className={cl("bar-chip-action", "bar-chip-action-danger")}
                    aria-label="Delete bookmark"
                    onClick={e => {
                        e.stopPropagation();
                        void removeBookmark(view);
                    }}
                >
                    <TrashIcon height={11} width={11} />
                </button>
            </span>
        </div>
    );
}

/**
 * A ChannelTabs-style bar at the top of the window with every bookmark as a
 * clickable chip, plus a star chip to bookmark the current view.
 * Rendered into Discord's "notice" grid area, exactly like ChannelTabs' tab bar.
 */
export default function QuickBar() {
    const { quickBar } = settings.use(["quickBar"]);

    const bookmarks = useBookmarks();
    const view = getCurrentViewSafe();
    const bookmarked = view ? isViewBookmarked(view) : false;

    const [editingId, setEditingId] = useState<string | null>(null);

    const forceUpdate = useForceUpdater();

    // keep the "bookmark this view" star chip in sync while navigating
    useEffect(() => {
        const onNavigation = () => forceUpdate();
        FluxDispatcher.subscribe("CHANNEL_SELECT", onNavigation);
        window.addEventListener("popstate", onNavigation);
        return () => {
            FluxDispatcher.unsubscribe("CHANNEL_SELECT", onNavigation);
            window.removeEventListener("popstate", onNavigation);
        };
    }, []);

    if (!quickBar) return null;

    // ChannelTabs' tab bar lives in the same grid area; don't double-stack
    try {
        if (isPluginEnabled("ChannelTabs")) {
            const ct = Vencord.Plugins.plugins.ChannelTabs as any;
            if (ct?.util?.settings?.store?.tabBarPosition === "top") return null;
        }
    } catch { /* ignore */ }

    return (
        <div className={cl("bar")}>
            <div className={cl("bar-scroller")}>
                {view && (
                    <Tooltip text={bookmarked ? "Remove bookmark for this view" : "Bookmark this view"}>
                        {({ onMouseEnter, onMouseLeave }) => (
                            <button
                                className={classes(cl("bar-chip"), cl("bar-chip-star"), bookmarked && cl("bar-chip-star-on"))}
                                onClick={() => void toggleBookmark(view)}
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                            >
                                {bookmarked ? <CheckIcon height={14} width={14} /> : <StarIcon height={14} width={14} />}
                            </button>
                        )}
                    </Tooltip>
                )}
                {bookmarks.map(bookmark => (
                    <QuickBarChip
                        key={bookmark.id}
                        bookmark={bookmark}
                        editing={editingId === bookmark.id}
                        startRename={() => setEditingId(bookmark.id)}
                        stopRename={() => setEditingId(null)}
                    />
                ))}
            </div>
        </div>
    );
}

/** getCurrentView can throw in weird states, never let the bar crash over it */
function getCurrentViewSafe(): View | undefined {
    try {
        return getCurrentView();
    } catch {
        return undefined;
    }
}
