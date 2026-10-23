import {
  collection,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export function watchOrders(uid, isAdmin, onData, onError) {
  const q = isAdmin
    ? query(collection(db, 'orders'))
    : query(collection(db, 'orders'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      ),
    onError
  );
}

export async function createOrder(user, form) {
  const items = form.items.map((i) => ({
    name: i.name.trim(),
    url: i.url.trim(),
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
  }));

  if (
    !items.length ||
    items.some(
      (i) =>
        !i.name ||
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        !Number.isFinite(i.unitPrice) ||
        i.unitPrice < 0
    )
  ) {
    throw new Error('Articles invalides');
  }

  const total = Math.round(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) * 100) / 100;

  return addDoc(collection(db, 'orders'), {
    title: form.title.trim(),
    supplierId: form.supplierId,
    project: form.project,
    priority: form.priority,
    notes: form.notes.trim(),
    items,
    total,
    userId: user.uid,
    userEmail: user.email,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function changeStatus(id, status) {
  return updateDoc(doc(db, 'orders', id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function batchChangeStatus(orderIds, status) {
  const batch = writeBatch(db);
  orderIds.forEach((id) => {
    batch.update(doc(db, 'orders', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  });
  return batch.commit();
}
