import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createMemoryRepo } from './repository/memoryRepo.js';
import { createFirestoreRepo } from './repository/firestoreRepo.js';
import { initFirestore } from './config/firebase.js';

const env = loadEnv();
const db = initFirestore();
const repo = db ? createFirestoreRepo(db) : createMemoryRepo();
if (!db) console.warn('Sem credenciais Firebase — usando repository em memória (dados voláteis).');

const app = createApp(repo, { corsOrigins: env.corsOrigins, adminToken: env.adminToken });
app.listen(env.port, () => console.log(`JavaBlocks backend na porta ${env.port}`));
