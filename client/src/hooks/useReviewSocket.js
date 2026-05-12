import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const useReviewSocket = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [prStatuses, setPrStatuses] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', userId);
    });

    socketRef.current.on('pr_status', ({ prId, status, message }) => {
      setPrStatuses((prev) => ({ ...prev, [prId]: { status, message } }));
    });


    socketRef.current.on('pr_reviewed', (data) => {
      setPrStatuses((prev) => ({
        ...prev,
        [data.prId]: { status: 'reviewed', score: data.score },
      }));

      setNotifications((prev) => [
        {
          id: Date.now(),
          prId: data.prId,
          reviewId: data.reviewId,
          prNumber: data.prNumber,
          prTitle: data.prTitle,
          score: data.score,
          totalIssues: data.totalIssues,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
    });

    return () => socketRef.current?.disconnect();
  }, [userId]);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    prStatuses,
    markRead,
    markAllRead,
  };
};

export default useReviewSocket;