import { createServiceApp } from '@heady-ai/service-runtime';
import type { ServiceManifest } from '@heady-ai/contract-types';

const manifest: ServiceManifest = {
  "name": "hcfullpipeline-executor",
  "version": "0.2.0",
  "port": 4314,
  "summary": "21-stage (fib(8)) pipeline execution and stage-level checkpointing.",
  "routes": [
    "/pipeline/run",
    "/pipeline/status",
    "/pipeline/maintenance"
  ],
  "dependencies": [
    "contract-types",
    "csl-gate"
  ]
} as ServiceManifest;
const app = createServiceApp(manifest);

app.post('/pipeline/run', async (request) => ({
  runId: crypto.randomUUID(),
  accepted: true,
  request: request.body,
  stages: 21,
}));

app.get('/pipeline/status', async () => ({
  state: 'idle',
  stages: 21,
  hotPoolReserved: 13,
  stageManifest: [
    'Stages 0-20: Core HCFullPipeline (fib(8) = 21 canonical stages)',
    'Maintenance runs via system_operations side lane',
  ],
}));

// Maintenance cycle — runs via system_operations side lane, NOT as a main stage
app.post('/pipeline/maintenance', async () => {
  const maintenanceUrl = process.env.HEADY_MAINTENANCE_URL
    || process.env.HEADY_MAINTENANCE_CLOUD_RUN_URL
    || 'https://heady-maintenance-609590223909.us-central1.run.app';
  try {
    const response = await fetch(`${maintenanceUrl}/maintenance/dry-run`, { method: 'POST' });
    const result = await response.json();
    return { lane: 'system_operations', name: 'heady-maintenance', accepted: true, result };
  } catch (error: any) {
    return { lane: 'system_operations', name: 'heady-maintenance', accepted: false, error: error.message };
  }
});

const port = Number(process.env.PORT ?? 4314);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`hcfullpipeline-executor listening on ${port}`);
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
