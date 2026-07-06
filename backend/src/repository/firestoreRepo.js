import admin from 'firebase-admin';

const CONFIG_DOC = 'global';

export function createFirestoreRepo(db) {
  const col = (name) => db.collection(name);

  return {
    async listChallenges() {
      const snap = await col('challenges').get();
      return snap.docs.map((d) => d.data())
        .sort((a, b) => (a.modulo - b.modulo) || (a.ordem - b.ordem));
    },
    async getChallengeById(id) {
      const doc = await col('challenges').doc(id).get();
      return doc.exists ? doc.data() : null;
    },
    async createChallenge(challenge) {
      await col('challenges').doc(challenge.id).set(challenge);
      return challenge;
    },
    async updateChallenge(id, patch) {
      const ref = col('challenges').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      const merged = { ...doc.data(), ...patch, id };
      await ref.set(merged);
      return merged;
    },
    async deleteChallenge(id) {
      const ref = col('challenges').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return false;
      await ref.delete();
      return true;
    },
    async getConfig() {
      const doc = await col('config').doc(CONFIG_DOC).get();
      return doc.exists ? doc.data() : {};
    },
    async setConfig(patch) {
      const ref = col('config').doc(CONFIG_DOC);
      const doc = await ref.get();
      const merged = { ...(doc.exists ? doc.data() : {}), ...patch };
      await ref.set(merged);
      return merged;
    },
    async listGroups() {
      const snap = await col('groups').get();
      return snap.docs.map((d) => d.data());
    },
    async incrementGroupXp(nome, xp) {
      await col('groups').doc(nome).set(
        { nome, xp: admin.firestore.FieldValue.increment(xp) },
        { merge: true }
      );
    },
    async addSubmission(submission) {
      const s = { timestamp: Date.now(), ...submission };
      await col('submissions').add(s);
      return s;
    },
    async listSubmissions() {
      const snap = await col('submissions').get();
      return snap.docs.map((d) => d.data());
    }
  };
}
