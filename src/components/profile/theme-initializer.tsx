'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useEffect } from 'react';
import { doc } from '@/lib/client/document-client';
import { getInterfaceTheme } from '@/lib/interface-themes';

/**
 * This component runs once when the app loads for a logged-in user.
 * It fetches the user's saved theme from Firestore and applies it.
 * This ensures the theme is consistent across sessions.
 */
export function ClientThemeInitializer() {
    const { user } = useUser();

    const userDocRef = useMemoFirebase(() => {
        return user ? doc(null, 'users', user.uid) : null;
    }, [user]);

    // Only call useDoc if we have a user ID.
    const { data: userProfile } = useDoc<UserProfile>(userDocRef);

    useEffect(() => {
        const root = document.documentElement;
        const theme = getInterfaceTheme(userProfile?.themeId);
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--background', theme.background);
        root.style.setProperty('--sidebar-background', theme.sidebar);
        root.style.setProperty('--sidebar-accent', theme.sidebarAccent);
    }, [userProfile]);

    // This component renders nothing.
    return null;
}
