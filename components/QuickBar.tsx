/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { FluxDispatcher, Tooltip, useDrag, useDrop, useEffect, useRef, useState } from "@webpack/common";

import { settings } from "../util/constants";
import { StarFilledIcon, StarIcon } from "../util/icons";
import { navigateToView } from "../util/navigation";
import { isViewBookmarked, moveBookmarks, renameBookmark, toggleBookmark, useBookmarks } from "../util/store";
import { Bookmark, View } from "../util/types";
import { useBookmarkBadges } from "../util/unread";
import { bookmarkToView, getCurrentView, getViewName } from "../util/view";
import BookmarkIcon from "./BookmarkIcon";
import { openBookmarkMenu } from "./BookmarkMenu";

const cl = classNameFactory("vc-bookmarktabs-");

function QuickBarChip({ bookmark, index, editing, startRename, stopRename }: {
    bookmark: Bookmark;
    index: number;
    editing: boolean;
    startRename(): void;
    stopRename(): void;
}) {
    const [draft, setDraft] = useState(bookmark.name);
    const ref = useRef<HTMLDivElement>(null);

    const { unreadBadges } = settings.use(["unreadBadges"]);
    const badges = useBookmarkBadges(bookmark);

    const view = bookmarkToView(bookmark);
    const displayName = bookmark.name || getViewName(view);

    // drag & drop reordering (ChannelTabs-style, horizontal)
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "vc_bookmarktabs_reorder",
        canDrag: () => !editing,
        item: () => ({ index }),
        collect: monitor => ({ isDragging: !!monitor.isDragging() })
    }), [index, editing]);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: "vc_bookmarktabs_reorder",
        hover: (item: { index: number }, monitor) => {
            if (!ref.current || editing) return;
            if (item.index === index) return;

            const rect = ref.current.getBoundingClientRect();
            const hoverMiddleX = (rect.right - rect.left) / 2;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            const hoverClientX = clientOffset.x - rect.left;
            if (item.index < index && hoverClientX < hoverMiddleX) return;
            if (item.index > index && hoverClientX > hoverMiddleX) return;

            moveBookmarks(item.index, index);
            item.index = index;
        },
        collect: monitor => ({ isOver: !!monitor.isOver({ shallow: true }) })
    }), [index, editing]);

    drag(drop(ref));

    if (editing) {
        return (
            <div ref={ref} className={classes(cl("bar-chip"), cl("bar-chip-editing"))}>
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
            ref={ref}
            className={classes(
                cl("bar-chip"),
                isDragging && cl("bar-chip-dragging"),
                isOver && cl("bar-chip-over")
            )}
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
        </div>
    );
}

/**
 * A ChannelTabs-style bar shown at the top of the chat, right below the
 * channel header. Each bookmark is a clickable chip: click to jump,
 * right-click for the menu, drag to reorder. The star chip bookmarks
 * (or unbookmarks) the view you're currently in.
 */
export default function QuickBar() {
    const { quickBar } = settings.use(["quickBar"]);

    const bookmarks = useBookmarks();
    const view = getCurrentViewSafe();
    const bookmarked = view ? isViewBookmarked(view) : false;

    const [editingId, setEditingId] = useState<string | null>(null);

    const forceUpdate = useForceUpdater();

    // keep the star chip in sync while navigating
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
                                aria-label={bookmarked ? "Remove bookmark for this view" : "Bookmark this view"}
                            >
                                {bookmarked ? <StarFilledIcon height={16} width={16} /> : <StarIcon height={16} width={16} />}
                            </button>
                        )}
                    </Tooltip>
                )}
                {bookmarks.map((bookmark, index) => (
                    <QuickBarChip
                        key={bookmark.id}
                        bookmark={bookmark}
                        index={index}
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
