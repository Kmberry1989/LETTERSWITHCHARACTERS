'use client';

import { useUser, useDoc } from '@/firebase';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useEffect } from 'react';

const themes = [
    { id: 'default', name: 'Classic Red', primary: '231 48% 48%', accent: '55 100% 61.2%' },
    { id: 'forest', name: 'Forest Green', primary: '142 76% 36%', accent: '45 80% 60%' },
    { id: 'cosmic', name: 'Cosmic Purple', primary: '262 84% 59%', accent: '280 80% 70%' },
    { id: 'ocean', name: 'Ocean Blue', primary: '210 80% 50%', accent: '190 70% 60%' },
    { id: 'sunset', name: 'Sunset Orange', primary: '25 95% 53%', accent: '40 90% 65%' },
    { id: 'mono', name: 'Monochrome', primary: '240 10% 3.9%', accent: '240 5% 65%' },
];

/**
 * This component runs once when the app loads for a logged-in user.
 * It fetches the user's saved theme from Firestore and applies it.
 * This ensures the theme is consistent across sessions.
 */
export function ClientThemeInitializer() {
    const { user, loading: userLoading } = useUser();
    // Only call useDoc if we have a user ID.
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : undefined);

    useEffect(() => {
        // We only apply the theme if we have a user profile with a themeId.
        if (userProfile?.themeId) {
            const theme = themes.find(t => t.id === userProfile.themeId);
            if (theme) {
                const root = document.documentElement;
                root.style.setProperty('--primary', theme.primary);
                root.style.setProperty('--accent', theme.accent);
            }
        }
    }, [userProfile]);

    // This component renders nothing.
    return null;
}
