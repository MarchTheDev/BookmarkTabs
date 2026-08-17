/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { getGuildAcronym } from "@utils/discord";
import { Avatar, ChannelStore, GuildStore, UserStore } from "@webpack/common";

import { getPageIcon } from "../util/icons";
import { Bookmark } from "../util/types";

const cl = classNameFactory("vc-bookmarktabs-");

/** Icon for a bookmark: guild icon, DM avatar, page icon, or a # fallback */
export default function BookmarkIcon({ bookmark }: { bookmark: Bookmark; }) {
    if (bookmark.kind === "page") {
        const Icon = getPageIcon(bookmark.path!);
        return <Icon height={20} width={20} className={cl("page-icon")} />;
    }

    const { guildId } = bookmark;
    const guild = guildId && guildId !== "@me" ? GuildStore.getGuild(guildId) : null;

    if (guild) {
        return guild.icon
            ? <img
                className={cl("guild-img")}
                src={`https://${window.GLOBAL_ENV.CDN_HOST}/icons/${guild.id}/${guild.icon}.png?size=40`}
                alt=""
            />
            : <span className={cl("guild-fallback")}>{getGuildAcronym(guild)}</span>;
    }

    if (bookmark.kind === "channel" && bookmark.channelId) {
        const channel = ChannelStore.getChannel(bookmark.channelId);
        if (channel?.recipients?.length) {
            const first = UserStore.getUser(channel.recipients[0]);
            return <Avatar size="SIZE_20" src={first?.getAvatarURL(void 0, 40)} />;
        }
    }

    return <span className={cl("guild-fallback")}>#</span>;
}
