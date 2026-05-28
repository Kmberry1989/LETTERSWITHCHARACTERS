'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

type TurnNotificationOptions = {
  enabled: boolean;
  isUsersTurn: boolean;
  title: string;
  body: string;
};

const TITLE_IDLE = 'Letters with Characters';
const TITLE_TURN = 'Your Turn - Letters with Characters';
const PERMISSION_KEY = 'lwc_notification_permission_requested';

export function useTurnNotifications({ enabled, isUsersTurn, title, body }: TurnNotificationOptions) {
  const { toast } = useToast();
  const hasMountedRef = useRef(false);
  const previousTurnRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    document.title = isUsersTurn ? TITLE_TURN : TITLE_IDLE;

    return () => {
      document.title = TITLE_IDLE;
    };
  }, [enabled, isUsersTurn]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'default') {
      return;
    }

    if (window.localStorage.getItem(PERMISSION_KEY) === 'requested') {
      return;
    }

    window.localStorage.setItem(PERMISSION_KEY, 'requested');
    void Notification.requestPermission().catch(() => null);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      previousTurnRef.current = false;
      return;
    }

    const previousTurn = previousTurnRef.current;
    previousTurnRef.current = isUsersTurn;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!previousTurn && isUsersTurn) {
      toast({
        title,
        description: body,
      });

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, { body });
        notification.onclick = () => {
          window.focus();
        };
      }
    }
  }, [body, enabled, isUsersTurn, title, toast]);
}
