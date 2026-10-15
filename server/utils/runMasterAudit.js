import { runStopsTests } from './testStops.js';
import { runActivitiesTests } from './testActivities.js';
import { runItineraryTests } from './testItinerary.js';
import { runBudgetTests } from './testBudget.js';
import { runPublicSharingTests } from './testPublicSharing.js';
import { runProfileTests } from './testProfile.js';
import { runAdminTests } from './testAdmin.js';

/**
 * GlobeTrotter Master System Audit & Verification Suite
 */
export async function runMasterAudit() {
  console.log('===========================================================');
  console.log(' 🌍 GLOBETROTTER — COMPREHENSIVE MASTER AUDIT & SYSTEM TEST');
  console.log('===========================================================');

  try {
    console.log('\n--- 1. STOPS & CITY DISCOVERY AUDIT ---');
    await runStopsTests();

    console.log('\n--- 2. ACTIVITIES DISCOVERY & FILTERS AUDIT ---');
    await runActivitiesTests();

    console.log('\n--- 3. ITINERARY BUILDER AUDIT ---');
    await runItineraryTests();

    console.log('\n--- 4. BUDGET & COST BREAKDOWN AUDIT ---');
    await runBudgetTests();

    console.log('\n--- 5. PUBLIC SHARING & COPY AUDIT ---');
    await runPublicSharingTests();

    console.log('\n--- 6. PROFILE & PREFERENCES AUDIT ---');
    await runProfileTests();

    console.log('\n--- 7. ADMIN ANALYTICS & SECURITY AUDIT ---');
    await runAdminTests();

    console.log('\n===========================================================');
    console.log(' 🎉 MASTER AUDIT COMPLETE: ALL SUBSYSTEMS VERIFIED 100%');
    console.log('===========================================================');
    return true;
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error.message);
    process.exit(1);
  }
}

import { pathToFileURL } from 'url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMasterAudit();
}
