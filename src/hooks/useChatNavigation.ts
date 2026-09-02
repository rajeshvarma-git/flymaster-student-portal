import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CHAT_PATH, getAuthRedirectPath } from '@/lib/auth-utils';

export function useChatNavigation() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const requireAuthForChat = useCallback(
    (event?: React.MouseEvent) => {
      if (loading) {
        event?.preventDefault();
        return false;
      }

      if (!user) {
        event?.preventDefault();
        navigate(getAuthRedirectPath(CHAT_PATH), {
          state: { from: { pathname: CHAT_PATH } },
        });
        return false;
      }

      return true;
    },
    [user, loading, navigate]
  );

  return { requireAuthForChat, isLoggedIn: !!user, loading };
}
