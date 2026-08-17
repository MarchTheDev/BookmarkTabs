/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { ChannelStore, ContextMenuApi, FluxDispatcher, Menu, ReadStateStore, ReadStateUtils } from "@webpack/common";
import { MouseEvent } from "react";

import { navigateToView } from "../util/navigation";
import { removeBookmark } from "../util/store";
import { Bookmark, View } from "../util/types";

interface BookmarkMenuProps {
    bookmark: Bookmark;
    view: View;
    /** called after navigation so the popout closes */
    onNavigate(): void;
    /** called when "Rename" is clicked (starts inline editing) */
    onRename(): void;
}

/**
 * ChannelTabs-inspired right-click menu for a bookmark:
 * Open / Open in New Tab (if ChannelTabs is enabled) / Mark as Read / Rename / Delete
 */
export function BookmarkMenu({ bookmark, view, onNavigate, onRename }: BookmarkMenuProps) {
    const channelId = bookmark.kind === "channel" ? bookmark.channelId : undefined;
    const hasUnread = channelId ? ReadStateStore.hasUnread(channelId) : false;

    const channelTabs = (() => {
        try {
            return isPluginEnabled("ChannelTabs") ? Vencord.Plugins.plugins.ChannelTabs as any : null;
        } catch {
            return null;
        }
    })();

    return (
        <Menu.Menu
            navId="bookmarktabs-bookmark-menu"
            onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
            aria-label="Bookmark menu"
        >
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="bookmarktabs-open"
                    label="Open"
                    action={() => {
                        navigateToView(view);
                        onNavigate();
                    }}
                />
                {channelId && channelTabs?.util?.createTab && (
                    <Menu.MenuItem
                        id="bookmarktabs-open-in-tab"
                        label="Open in New Tab"
                        action={() => {
                            channelTabs.util.createTab({
                                guildId: bookmark.guildId ?? "@me",
                                channelId
                            }, true);
                            onNavigate();
                        }}
                    />
                )}
                {channelId && (
                    <Menu.MenuItem
                        id="bookmarktabs-mark-read"
                        label="Mark as Read"
                        disabled={!hasUnread}
                        action={() => {
                            const channel = ChannelStore.getChannel(channelId);
                            if (channel) ReadStateUtils.ackChannel(channel);
                        }}
                    />
                )}
            </Menu.MenuGroup>
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="bookmarktabs-rename"
                    label="Rename"
                    action={onRename}
                />
                <Menu.MenuItem
                    id="bookmarktabs-delete"
                    label="Delete Bookmark"
                    action={() => void removeBookmark(view)}
                />
            </Menu.MenuGroup>
        </Menu.Menu>
    );
}

/** Opens the bookmark context menu at the mouse position */
export function openBookmarkMenu(e: MouseEvent, props: BookmarkMenuProps) {
    ContextMenuApi.openContextMenu(e, () => <BookmarkMenu {...props} />);
}
