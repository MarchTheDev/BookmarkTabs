/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Channel, Guild } from "@vencord/discord-types";
import { Menu } from "@webpack/common";
import { ReactElement } from "react";

import { StarFilledIcon, StarIcon } from "../util/icons";
import { isViewBookmarked, toggleBookmark } from "../util/store";
import { View } from "../util/types";

function bookmarkMenuItem(view: View) {
    const bookmarked = isViewBookmarked(view);
    return (
        <Menu.MenuItem
            id="bookmarktabs-toggle-bookmark"
            label={bookmarked ? "Remove Bookmark" : "Bookmark"}
            icon={bookmarked ? StarFilledIcon : StarIcon}
            action={() => void toggleBookmark(view)}
        />
    );
}

function pushMenuItem(children: Array<ReactElement | null>, item: ReactElement, anchorId?: string) {
    const group = anchorId ? findGroupChildrenByChildId(anchorId, children) : null;
    if (group) {
        group.push(item);
    } else {
        children.push(<Menu.MenuGroup>{item}</Menu.MenuGroup>);
    }
}

/** Right-click on a channel / DM / group chat / mention */
export const channelContextMenuPatch: NavContextMenuPatchCallback = (children, props: { channel?: Channel; }) => {
    const { channel } = props;
    if (!channel) return;

    const view: View = {
        kind: "channel",
        guildId: channel.guild_id ?? "@me",
        channelId: channel.id
    };

    pushMenuItem(children, bookmarkMenuItem(view), "channel-copy-link");
};

/** Right-click on a server icon / server header */
export const guildContextMenuPatch: NavContextMenuPatchCallback = (children, props: { guild?: Guild; }) => {
    const { guild } = props;
    if (!guild) return;

    const view: View = { kind: "guild", guildId: guild.id };

    pushMenuItem(children, bookmarkMenuItem(view));
};
