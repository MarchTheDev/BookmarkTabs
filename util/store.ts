/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { FluxDispatcher, showToast, Toasts, useEffect, UserStore, useState } from "@webpack/common";

import { DATA_KEY, logger } from "./constants";
import { Bookmark, View } from "./types";
import { bookmarkKey, getViewName, viewKey } from "./view";

let bookmarks: Bookmark[] = [];
let userId: string | undefined;
const listeners = new Set<() => void>();

export function getBookmarks(): Bookmark[] {
    return bookmarks;
}

/** Subscribe to bookmark changes, returns an unsubscribe function */
export function subscribeBookmarks(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function notify() {
    for (const fn of [...listeners]) fn();
}

function newId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function persist() {
    if (!userId) return;
    try {
        await DataStore.update<Record<string, Bookmark[]>>(DATA_KEY, old => ({
            ...(old ?? {}),
            [userId!]: [...bookmarks]
        }));
    } catch (err) {
        logger.error("Failed to save bookmarks", err);
    }
}

// debounce so fast operations (like live drag reordering) don't spam DataStore
let persistTimeout: NodeJS.Timeout | undefined;
function persistDebounced() {
    clearTimeout(persistTimeout);
    persistTimeout = setTimeout(() => void persist(), 300);
}

async function load() {
    const user = UserStore.getCurrentUser();
    if (!user) return;

    userId = user.id;
    try {
        const all = await DataStore.get<Record<string, Bookmark[]>>(DATA_KEY);
        bookmarks = all?.[userId] ?? [];
    } catch (err) {
        logger.error("Failed to load bookmarks", err);
        bookmarks = [];
    }
    notify();
}

export function isViewBookmarked(view: View): boolean {
    const key = viewKey(view);
    return bookmarks.some(b => bookmarkKey(b) === key);
}

/** Add a bookmark if it doesn't exist yet. Empty name = derive it live. */
export async function addBookmark(view: View, customName?: string): Promise<boolean> {
    if (isViewBookmarked(view)) return false;

    const bookmark: Bookmark = {
        id: newId(),
        kind: view.kind,
        name: customName?.trim() ?? "",
        ...(view.kind === "channel" ? { guildId: view.guildId, channelId: view.channelId }
            : view.kind === "guild" ? { guildId: view.guildId }
                : { path: view.path })
    };

    bookmarks = [...bookmarks, bookmark];
    notify();
    void persist();
    showToast(`Bookmarked ${bookmark.name || getViewName(view)}`, Toasts.Type.SUCCESS);
    return true;
}

export async function removeBookmark(view: View): Promise<boolean> {
    const key = viewKey(view);
    const next = bookmarks.filter(b => bookmarkKey(b) !== key);
    if (next.length === bookmarks.length) return false;

    bookmarks = next;
    notify();
    void persist();
    showToast("Bookmark removed", Toasts.Type.MESSAGE);
    return true;
}

/** Rename a bookmark. An empty name resets it to the live-derived name. */
export async function renameBookmark(id: string, name: string): Promise<void> {
    bookmarks = bookmarks.map(b => b.id === id ? { ...b, name: name.trim() } : b);
    notify();
    void persist();
}

/** Move a bookmark from one position to another (drag & drop reordering) */
export function moveBookmarks(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= bookmarks.length) return;
    if (toIndex < 0 || toIndex >= bookmarks.length) return;
    if (fromIndex === toIndex) return;

    const [moved] = bookmarks.splice(fromIndex, 1);
    bookmarks.splice(toIndex, 0, moved);

    notify();
    persistDebounced();
}

/** Bookmark or un-bookmark the given view */
export async function toggleBookmark(view: View): Promise<boolean> {
    return isViewBookmarked(view) ? removeBookmark(view) : addBookmark(view);
}

/** React hook returning the current user's bookmarks (re-renders on changes) */
export function useBookmarks(): Bookmark[] {
    const [state, setState] = useState<Bookmark[]>(getBookmarks());
    useEffect(() => subscribeBookmarks(() => setState(getBookmarks())), []);
    return state;
}

let loginRegistered = false;

/** Load bookmarks for the current user; also reload on login/account switch */
export function init() {
    if (!loginRegistered) {
        FluxDispatcher.subscribe("CONNECTION_OPEN_SUPPLEMENTAL", onLogin);
        loginRegistered = true;
    }
    void load();
}

function onLogin() {
    const user = UserStore.getCurrentUser();
    if (user && user.id !== userId) void load();
}
