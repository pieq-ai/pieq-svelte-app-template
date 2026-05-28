import { test as setup } from '@playwright/test';
import { cleanDatabase } from '../utils/db-helper';
import { setupBaseMasterData } from '../fixtures/test-data';

setup('do global setup', async () => {
  // Clear out database to avoid state leakage between test runs
  console.log('Cleaning database...');
  await cleanDatabase();

  // Create base master data required for the tests
  console.log('Seeding base master data for tests...');
  await setupBaseMasterData();
});
