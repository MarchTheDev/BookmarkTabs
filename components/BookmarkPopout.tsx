/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { useState } from "@webpack/common";

import { settings } from "../util/constants";
import { BookmarkRibbonIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "../util/icons";
import { navigateToView } from "../util/navigation";
import { isViewBookmarked, removeBookmark, renameBookmark, toggleBookmark, useBookmarks } from "../util/store";
import { Bookmark, View } from "../util/types";
import { useBookmarkBadges } from "../util/unread";
import { bookmarkToView, getViewName } from "../util/view";
import BookmarkIcon from "./BookmarkIcon";

const cl = classNameFactory("vc-bookmarktabs-");

function BookmarkRow({ bookmark, onNavigate }: { bookmark: Bookmark; onNavigate(): void; }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(bookmark.name);

    const { unreadBadges } = settings.use(["unreadBadges"]);
    const badges = useBookmarkBadges(bookmark);

    const view = bookmarkToView(bookmark);
    const displayName = bookmark.name || getViewName(view);

    if (editing) {
        return (
            <div className={classes(cl("row"), cl("row-editing"))}>
                <span className={cl("row-icon")}><BookmarkIcon bookmark={bookmark} /></span>
                <input
                    className={cl("row-input")}
                    value={draft}
                    placeholder={getViewName(view)}
                    autoFocus={true}
                    onChange={e => setDraft(e.target.value)}
                    onFocus={e => e.currentTarget.select()}
                    onClick={e => e.stopPropagation()}
                    onBlur={() => {
                        void renameBookmark(bookmark.id, draft);
                        setEditing(false);
                    }}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            void renameBookmark(bookmark.id, draft);
                            setEditing(false);
                        } else if (e.key === "Escape") {
                            setDraft(bookmark.name);
                            setEditing(false);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={cl("row")}
            role="button"
            tabIndex={0}
            onClick={() => {
                navigateToView(view);
                onNavigate();
            }}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateToView(view);
                    onNavigate();
                }
            }}
        >
            <span className={cl("row-icon")}><BookmarkIcon bookmark={bookmark} /></span>
            <span className={cl("row-name")} title={displayName}>{displayName}</span>
            {unreadBadges && (
                badges.mentionCount > 0
                    ? <span className={classes(cl("row-dot"), cl("row-dot-mention"))} />
                    : badges.hasUnread
                        ? <span className={classes(cl("row-dot"), cl("row-dot-unread"))} />
                        : null
            )}
            <div className={cl("row-actions")}>
                <button
                    className={cl("row-action")}
                    aria-label="Rename bookmark"
                    onClick={e => {
                        e.stopPropagation();
                        setDraft(bookmark.name);
                        setEditing(true);
                    }}
                >
                    <PencilIcon height={13} width={13} />
                </button>
                <button
                    className={classes(cl("row-action"), cl("row-action-danger"))}
                    aria-label="Delete bookmark"
                    onClick={e => {
                        e.stopPropagation();
                        void removeBookmark(view);
                    }}
                >
                    <TrashIcon height={13} width={13} />
                </button>
            </div>
        </div>
    );
}

export default function BookmarkPopout({ view, closePopout }: { view: View; closePopout(): void; }) {
    const bookmarks = useBookmarks();
    const bookmarked = isViewBookmarked(view);
    const currentName = getViewName(view);

    return (
        <div className={cl("popout")} role="dialog" aria-label="Bookmarks">
            <div className={cl("popout-header")}>
                <span className={cl("popout-title")}>Bookmarks</span>
                <button className={cl("popout-close")} onClick={closePopout} aria-label="Close bookmarks">
                    <XIcon height={15} width={15} />
                </button>
            </div>

            <button
                className={classes(cl("popout-current"), bookmarked && cl("popout-current-active"))}
                onClick={() => void toggleBookmark(view)}
            >
                <span className={cl("popout-current-icon")}>
                    {bookmarked ? <CheckIcon height={15} width={15} /> : <PlusIcon height={15} width={15} />}
                </span>
                <span className={cl("popout-current-text")}>
                    <span className={cl("popout-current-label")}>{bookmarked ? "Bookmarked" : "Bookmark this view"}</span>
                    <span className={cl("popout-current-name")}>{currentName}</span>
                </span>
            </button>

            <div className={cl("popout-list")}>
                {bookmarks.length === 0 && (
                    <div className={cl("popout-empty")}>
                        <BookmarkRibbonIcon height={28} width={28} />
                        <p>No bookmarks yet.</p>
                        <p>Use the button above, or right-click a channel or server and hit "Bookmark".</p>
                    </div>
                )}
                {bookmarks.map(bookmark => (
                    <BookmarkRow key={bookmark.id} bookmark={bookmark} onNavigate={closePopout} />
                ))}
            </div>

            <div className={cl("popout-footer")}>Click a bookmark to jump straight to it</div>
        </div>
    );
}
