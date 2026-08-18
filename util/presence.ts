/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PresenceStore, useStateFromStores } from "@webpack/common";

export interface UserPresence {
    status: string;
    isMobile: boolean;
}

/** Live presence (online/idle/dnd/offline + mobile) for a user */
export function useUserPresence(userId: string): UserPresence {
    return useStateFromStores(
        [PresenceStore],
        () => ({
            status: PresenceStore.getStatus(userId) ?? "offline",
            isMobile: PresenceStore.isMobileOnline(userId)
        }),
        [userId]
    );
}
