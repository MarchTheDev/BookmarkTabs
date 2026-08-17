/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { FluxDispatcher, Tooltip, useEffect, useRef, useState } from "@webpack/common";
import type { PointerEvent as ReactPointerEvent } from "react";

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

const DRAG_THRESHOLD = 6; // px of horizontal movement before a drag starts

/** used to swallow the click that fires right after a drag ends */
let suppressClickUntil = 0;

function QuickBarChip({ bookmark, editing, startRename, stopRename, dragging, onDragStart }: {
    bookmark: Bookmark;
    editing: boolean;
    startRename(): void;
    stopRename(): void;
    dragging: boolean;
    onDragStart(e: ReactPointerEvent, bookmark: Bookmark): void;
}) {
    const [draft, setDraft] = useState(bookmark.name);

    const { unreadBadges } = settings.use(["unreadBadges"]);
    const badges = useBookmarkBadges(bookmark);

    const view = bookmarkToView(bookmark);
    const displayName = bookmark.name || getViewName(view);

    if (editing) {
        return (
            <div className={classes(cl("bar-chip"), cl("bar-chip-editing"))} data-bid={bookmark.id}>
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
            className={classes(cl("bar-chip"), dragging && cl("bar-chip-dragging"))}
            data-bid={bookmark.id}
            role="button"
            tabIndex={0}
            onPointerDown={e => {
                if (e.button !== 0) return;
                onDragStart(e, bookmark);
            }}
            onClick={() => {
                if (Date.now() < suppressClickUntil) {
                    suppressClickUntil = 0;
                    return;
                }
                navigateToView(view);
            }}
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
 * right-click for the menu, drag to reorder. Reordering is pointer-event
 * based (no react-dnd), so it works anywhere in Discord's tree without
 * needing a DndProvider — which is also why it can't silently crash.
 */
export default function QuickBar() {
    const { quickBar, starPosition } = settings.use(["quickBar", "starPosition"]);

    const bookmarks = useBookmarks();
    const view = getCurrentViewSafe();
    const bookmarked = view ? isViewBookmarked(view) : false;

    const [editingId, setEditingId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const scrollerRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
        pointerId: number;
        startX: number;
        bookmarkId: string;
        index: number;
        active: boolean;
    } | null>(null);

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

    // global pointer listeners while a drag session is live
    useEffect(() => {
        if (!draggingId) return;

        const onMove = (e: PointerEvent) => {
            const s = dragState.current;
            const scroller = scrollerRef.current;
            if (!s || !scroller || e.pointerId !== s.pointerId) return;

            if (!s.active) {
                if (Math.abs(e.clientX - s.startX) < DRAG_THRESHOLD) return;
                s.active = true;
            }

            e.preventDefault();

            // find the chip under the pointer and live-reorder around it
            const chips = Array.from(scroller.querySelectorAll<HTMLElement>(`.${cl("bar-chip")}[data-bid]`));
            const hovered = chips.find(chip => {
                const rect = chip.getBoundingClientRect();
                return e.clientX >= rect.left && e.clientX <= rect.right;
            });

            if (!hovered || hovered.dataset.bid === s.bookmarkId) return;

            const targetIndex = chips.indexOf(hovered);
            if (targetIndex !== s.index) {
                moveBookmarks(s.index, targetIndex);
                s.index = targetIndex;
            }
        };

        const onUp = (e: PointerEvent) => {
            const s = dragState.current;
            if (!s || e.pointerId !== s.pointerId) return;

            if (s.active) {
                // swallow the click that fires right after the drag
                suppressClickUntil = Date.now() + 500;
            }

            dragState.current = null;
            setDraggingId(null);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);

        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
    }, [draggingId]);

    if (!quickBar) return null;

    const starChip = view ? (
        <div className={classes(cl("bar-star"), starPosition === "right" ? cl("bar-star-right") : cl("bar-star-left"))}>
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
        </div>
    ) : null;

    return (
        <div className={cl("bar")}>
            {starPosition !== "right" && starChip}
            <div className={cl("bar-scroller")} ref={scrollerRef}>
                {bookmarks.map((bookmark, index) => (
                    <QuickBarChip
                        key={bookmark.id}
                        bookmark={bookmark}
                        editing={editingId === bookmark.id}
                        dragging={draggingId === bookmark.id}
                        startRename={() => setEditingId(bookmark.id)}
                        stopRename={() => setEditingId(null)}
                        onDragStart={(e, bm) => {
                            dragState.current = {
                                pointerId: e.pointerId,
                                startX: e.clientX,
                                bookmarkId: bm.id,
                                index,
                                active: false
                            };
                            setDraggingId(bm.id);
                        }}
                    />
                ))}
            </div>
            {starPosition === "right" && starChip}
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
