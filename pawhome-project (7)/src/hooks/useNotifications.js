import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notifsCol = collection(db, 'notifications', user.uid, 'items');
    const q = query(notifsCol, orderBy('createdAt', 'desc'), limit(15));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setNotifications(items);
        setUnreadCount(items.filter((item) => !item.read).length);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to notifications:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const markAsRead = async (notifId) => {
    if (!user) return;
    try {
      const itemRef = doc(db, 'notifications', user.uid, 'items', notifId);
      await updateDoc(itemRef, { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadItems = notifications.filter((n) => !n.read);
    try {
      await Promise.all(
        unreadItems.map((n) => {
          const ref = doc(db, 'notifications', user.uid, 'items', n.id);
          return updateDoc(ref, { read: true });
        })
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
