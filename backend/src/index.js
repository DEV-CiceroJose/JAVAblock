import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createMemoryRepo } from './repository/memoryRepo.js';

const env = loadEnv();
// A troca para o repository Firestore acontece na Task 8.
const repo = createMemoryRepo();
const app = createApp(repo, { corsOrigins: env.corsOrigins });
app.listen(env.port, () => console.log(`JavaBlocks backend na porta ${env.port}`));
