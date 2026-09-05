import { rm, mkdir } from 'node:fs/promises';

await rm('.test-data', { recursive: true, force: true });
await mkdir('.test-data', { recursive: true });
