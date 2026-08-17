/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { findCssClassesLazy } from "@webpack";
import { Dialog, useDrag, useDrop, useRef, useState } from "@webpack/common";

import { POPOUT_WIDTH, settings } from "../util/constants";
import { BookmarkRibbonIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "../util/icons";
import { navigateToView } from "../util/navigation";
import { isViewBookmarked, moveBookmarks, removeBookmark, renameBookmark, toggleBookmark, useBookmarks } from "../util/store";
import { Bookmark, View } from "../util/types";
import { useBookmarkBadges } from "../util/unread";
import { bookmarkToView, getViewName } from "../util/view";
import BookmarkIcon from "./BookmarkIcon";
import { openBookmarkMenu } from "./BookmarkMenu";

// Discord's own popout panel classes — guaranteed to look right on any theme
const PopoutClasses = findCssClassesLazy("container", "popoutRoleDot");

const cl = classNameFactory("vc-bookmarktabs-");

interface BookmarkRowProps {
    bookmark: Bookmark;
    index: number;
    editing: boolean;
    onNavigate(): void;
    onStartRename(): void;
    onStopRename(): void;
}

function BookmarkRow({ bookmark, index, editing, onNavigate, onStartRename, onStopRename }: BookmarkRowProps) {
    const [draft, setDraft] = useState(bookmark.name);
    const ref = useRef<HTMLDivElement>(null);

    const { unreadBadges } = settings.use(["unreadBadges"]);
    const badges = useBookmarkBadges(bookmark);

    const view = bookmarkToView(bookmark);
    const displayName = bookmark.name || getViewName(view);

    // drag & drop reordering (ChannelTabs-style)
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
            const hoverMiddleY = (rect.bottom - rect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            const hoverClientY = clientOffset.y - rect.top;
            if (item.index < index && hoverClientY < hoverMiddleY) return;
            if (item.index > index && hoverClientY > hoverMiddleY) return;

            moveBookmarks(item.index, index);
            item.index = index;
        },
        collect: monitor => ({ isOver: !!monitor.isOver({ shallow: true }) })
    }), [index, editing]);

    drag(drop(ref));

    if (editing) {
        return (
            <div ref={ref} className={classes(cl("row"), cl("row-editing"))}>
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
                        onStopRename();
                    }}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            void renameBookmark(bookmark.id, draft);
                            onStopRename();
                        } else if (e.key === "Escape") {
                            setDraft(bookmark.name);
                            onStopRename();
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
                cl("row"),
                isDragging && cl("row-dragging"),
                isOver && cl("row-over")
            )}
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
            onContextMenu={e => openBookmarkMenu(e, {
                bookmark,
                view,
                onNavigate,
                onRename: onStartRename
            })}
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
                        onStartRename();
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
    const [editingId, setEditingId] = useState<string | null>(null);

    const bookmarked = isViewBookmarked(view);
    const currentName = getViewName(view);

    return (
        <Dialog
            className={PopoutClasses.container}
            style={{ width: POPOUT_WIDTH, maxHeight: "min(480px, calc(100vh - 60px))" }}
        >
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
                    {bookmarks.map((bookmark, index) => (
                        <BookmarkRow
                            key={bookmark.id}
                            bookmark={bookmark}
                            index={index}
                            editing={editingId === bookmark.id}
                            onNavigate={closePopout}
                            onStartRename={() => setEditingId(bookmark.id)}
                            onStopRename={() => setEditingId(null)}
                        />
                    ))}
                </div>

                <div className={cl("popout-footer")}>Click to open · right-click for more · drag to reorder</div>
            </div>
        </Dialog>
    );
}
