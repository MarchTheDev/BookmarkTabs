/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@utils/css";
import { getGuildAcronym } from "@utils/discord";
import { Avatar, ChannelStore, GuildStore, UserStore } from "@webpack/common";

import { settings } from "../util/constants";
import { getPageIcon } from "../util/icons";
import { useUserPresence } from "../util/presence";
import { Bookmark } from "../util/types";

const cl = classNameFactory("vc-bookmarktabs-");

/**
 * DM bookmark avatar with Discord's own status indicator
 * (green = online, yellow = idle, red = DND, gray = offline,
 * phone icon = mobile). Exactly like the DM list.
 */
function DmAvatar({ userId }: { userId: string; }) {
    const { dmStatusIndicators } = settings.use(["dmStatusIndicators"]);
    const { status, isMobile } = useUserPresence(userId);
    const user = UserStore.getUser(userId);

    return (
        <Avatar
            size="SIZE_20"
            src={user?.getAvatarURL(void 0, 40)}
            status={dmStatusIndicators ? status : undefined}
            isMobile={isMobile}
        />
    );
}

/** Icon for a bookmark: guild icon, DM avatar (with status), page icon, or a # fallback */
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

        // 1:1 DM → avatar with live status dot
        if (channel?.recipients?.length === 1) {
            return <DmAvatar userId={channel.recipients[0]} />;
        }

        // Group DM → avatar of the first member, no status (like Discord)
        if (channel?.recipients?.length) {
            const first = UserStore.getUser(channel.recipients[0]);
            return <Avatar size="SIZE_20" src={first?.getAvatarURL(void 0, 40)} />;
        }
    }

    return <span className={cl("guild-fallback")}>#</span>;
}
