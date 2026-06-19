import { adminDb } from "./firebase/admin";

export async function deleteUserFirebaseData(userId: string) {
  const threadsSnap = await adminDb
    .collection(`users/${userId}/drq_threads`)
    .get();

  if (threadsSnap.empty) return;

  const batch = adminDb.batch();
  threadsSnap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
