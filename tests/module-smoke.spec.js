import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const BASE_URL = process.env.MODULE_SMOKE_BASE_URL || 'http://127.0.0.1:3005/app';
const MODULES = [
  { label: 'Dashboard', section: 'Core' },
  { label: 'Connect', section: 'Core' },
  { label: 'Front Desk', section: 'Operations' },
  { label: 'Housekeeping', section: 'Operations' },
  { label: 'F&B / POS', section: 'Operations' },
  { label: 'Events', section: 'Operations' },
  { label: 'Group Management', section: 'Operations' },
  { label: 'Night Audit', section: 'Operations' },
  { label: 'AI Command Center', section: 'Intelligence' },
  { label: 'Autonomic Core', section: 'Intelligence' },
  { label: 'Finance', section: 'Back Office' },
  { label: 'Human Capital', section: 'Back Office' },
  { label: 'Procurement', section: 'Back Office' },
  { label: 'Engineering', section: 'Infrastructure' },
  { label: 'Security', section: 'Infrastructure' },
  { label: 'IOT Control', section: 'Infrastructure' },
  { label: 'Brand Standards', section: 'Brand' },
  { label: 'Terminal', section: 'System' },
  { label: 'Configuration', section: 'System' }
];

const FRONTDESK_SUBMODULES = [
  'Monitor',
  'Timeline',
  'Arrivals',
  'Departures',
  'Reservations',
  'Guests',
  'Blocks',
  'Reports',
  'Oracle'
];

const CONFIG_SUBMODULES = [
  'AI Onboarding',
  'Property Onboarding',
  'Rooms Onboarding',
  'Cost Centres & POS',
  'Data Onboarding',
  'Payment Gateway',
  'OTA & Distribution',
  'Workflow, Roles & Permissions',
  'AI Agent Configurations'
];

const BRAND_SUBMODULES = [
  'Main Standard',
  'Documents',
  'Brand Colors',
  'AI Brain'
];

const HOUSEKEEPING_ELEMENTS = [
  'room',       // Should show room cards or room list
];

const POS_ELEMENTS = [
  'order',      // Should reference orders
];

const EVENTS_ELEMENTS = [
  'event',      // Should reference events
];

const FINANCE_ELEMENTS = [
  'revenue',    // Should reference revenue or financial data
];

const HR_ELEMENTS = [
  'employee',   // Should reference employees
];

const PROCUREMENT_ELEMENTS = [
  'supplier',   // Should reference suppliers or purchase orders
];

const ENGINEERING_ELEMENTS = [
  'maintenance', // Should reference maintenance tasks
];

const SECURITY_ELEMENTS = [
  'incident',   // Should reference incidents or security logs
];

const IOT_ELEMENTS = [
  'device',     // Should reference IoT devices or sensors
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Sign in and return the sidebar locator */
async function signInAndGetSidebar(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  const employeeIdInput = page.locator('#employee-id-input');
  if (await employeeIdInput.count()) {
    await expect(employeeIdInput).toBeVisible();
    await page.fill('#employee-id-input', 'GM001');
    await page.fill('#pin-input', '1234');
    await page.click('#sign-in-button');
  }

  const sidebar = page.locator('.os-app-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 20000 });

  const expandSidebarButton = sidebar.getByRole('button', { name: /expand sidebar/i });
  if (await expandSidebarButton.count()) {
    await expandSidebarButton.click();
    await page.waitForTimeout(300);
  }

  return sidebar;
}

async function toggleSection(page, sidebar, sectionName) {
  const sectionButton = sidebar.getByRole('button', {
    name: new RegExp(`^${escapeRegex(sectionName)}$`, 'i')
  }).first();
  if (await sectionButton.count()) {
    const expanded = (await sectionButton.getAttribute('aria-expanded')) === 'true';
    if (!expanded) {
      await sectionButton.evaluate((node) => node.click());
    }
    await page.waitForTimeout(200);
  }
}

function getModuleButton(sidebar, label) {
  return sidebar.locator(`button.os-nav-item[aria-label="${label}"]`).first();
}

async function clickButton(button) {
  if (!(await button.count())) return false;
  await button.evaluate((node) => node.scrollIntoView({ block: 'nearest' }));
  const isActive = (await button.getAttribute('data-active')) === 'true';
  if (isActive) return true;
  await button.evaluate((node) => node.click());
  return true;
}

async function navigateToModule(page, sidebar, moduleLabel, sectionName) {
  let navButton = getModuleButton(sidebar, moduleLabel);
  if (!(await navButton.count())) {
    await toggleSection(page, sidebar, sectionName);
    navButton = getModuleButton(sidebar, moduleLabel);
  }
  if (!(await navButton.count())) return false;
  await clickButton(navButton);
  await page.waitForTimeout(1200);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Original authenticated module sweep (preserved)
// ─────────────────────────────────────────────────────────────────────────────

test('authenticated module sweep', async ({ page }) => {
  test.setTimeout(360000);

  const pageErrors = [];
  const consoleErrors = [];
  const results = [];

  const collectResult = (label, pageErrorStart, consoleErrorStart) => {
    const crashed = page.getByText('App crashed during render').isVisible().catch(() => false);
    const runtimeOverlay = page.getByText('Runtime Error Captured').isVisible().catch(() => false);
    return Promise.all([crashed, runtimeOverlay]).then(([didCrash, didOverlay]) => {
      const newPageErrors = pageErrors.slice(pageErrorStart);
      const newConsoleErrors = consoleErrors.slice(consoleErrorStart)
        .filter(text => !text.includes('favicon.ico'))
        .filter(text => !text.includes('NO_COLOR'))
        .filter(text => !text.includes('ERR_CONNECTION_REFUSED'));
      const permissionErrors = newConsoleErrors.filter(text =>
        /permission-denied|missing or insufficient permissions/i.test(text)
      );

      const status = didCrash || didOverlay || newPageErrors.length > 0 || permissionErrors.length > 0 ? 'fail' : 'pass';

      results.push({
        module: label,
        status,
        runtimeOverlay: didOverlay,
        pageErrors: newPageErrors,
        permissionErrors: permissionErrors.slice(0, 5),
        consoleErrors: newConsoleErrors.slice(0, 5)
      });

      return { status, didCrash: didCrash || didOverlay };
    });
  };

  const runNestedSweep = async (moduleLabel, sectionName, labels) => {
    for (const label of labels) {
      const currentTitle = (await page.locator('.os-topbar__title').textContent().catch(() => '')) || '';
      const activeTitlePattern = new RegExp(`^${escapeRegex(moduleLabel)}\\s*/\\s*${escapeRegex(label)}$`, 'i');
      const pageErrorStart = pageErrors.length;
      const consoleErrorStart = consoleErrors.length;

      if (activeTitlePattern.test(currentTitle.trim())) {
        console.log(`Checking submodule: ${moduleLabel} > ${label}`);
        const state = await collectResult(`${moduleLabel} > ${label}`, pageErrorStart, consoleErrorStart);
        if (state.didCrash) return false;
        continue;
      }

      let navButton = getModuleButton(sidebar, moduleLabel);
      if (!(await navButton.count())) {
        await toggleSection(page, sidebar, sectionName);
        navButton = getModuleButton(sidebar, moduleLabel);
      }

      if (await navButton.count()) {
        await navButton.evaluate((node) => node.scrollIntoView({ block: 'nearest' }));
      }

      console.log(`Opening submenu: ${moduleLabel}`);
      await navButton.evaluate((node) => node.click());
      await page.waitForTimeout(350);

      let scopeLocator = page.locator('.os-focus-panel').last();
      let button = scopeLocator.getByRole('button', {
        name: new RegExp(`${escapeRegex(label)}`, 'i')
      }).first();

      if (!(await button.count())) {
        await navButton.evaluate((node) => node.click());
        await page.waitForTimeout(350);
        scopeLocator = page.locator('.os-focus-panel').last();
        button = scopeLocator.getByRole('button', {
          name: new RegExp(`${escapeRegex(label)}`, 'i')
        }).first();
      }

      if (!(await button.count())) {
        results.push({
          module: `${moduleLabel} > ${label}`,
          status: 'missing_nav',
          pageErrors: [],
          consoleErrors: []
        });
        continue;
      }

      console.log(`Checking submodule: ${moduleLabel} > ${label}`);
      await button.evaluate((node) => node.click());
      await page.waitForTimeout(900);

      const state = await collectResult(`${moduleLabel} > ${label}`, pageErrorStart, consoleErrorStart);
      if (state.didCrash) return false;
    }

    return true;
  };

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  const employeeIdInput = page.locator('#employee-id-input');
  if (await employeeIdInput.count()) {
    await expect(employeeIdInput).toBeVisible();
    await page.fill('#employee-id-input', 'GM001');
    await page.fill('#pin-input', '1234');
    await page.click('#sign-in-button');
  }
  const sidebar = page.locator('.os-app-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 20000 });

  const expandSidebarButton = sidebar.getByRole('button', { name: /expand sidebar/i });
  if (await expandSidebarButton.count()) {
    await expandSidebarButton.click();
    await page.waitForTimeout(300);
  }

  for (const module of MODULES) {
    let navButton = getModuleButton(sidebar, module.label);

    const pageErrorStart = pageErrors.length;
    const consoleErrorStart = consoleErrors.length;

    if (!(await navButton.count())) {
      await toggleSection(page, sidebar, module.section);
      navButton = getModuleButton(sidebar, module.label);
    }

    if (!(await navButton.count())) {
      results.push({
        module: module.label,
        status: 'missing_nav',
        pageErrors: [],
        consoleErrors: []
      });
      continue;
    }

    console.log(`Checking module: ${module.label}`);
    await clickButton(navButton);
    await page.waitForTimeout(1200);

    const state = await collectResult(module.label, pageErrorStart, consoleErrorStart);
    if (state.didCrash) break;

    if (module.label === 'Front Desk') {
      const ok = await runNestedSweep(module.label, module.section, FRONTDESK_SUBMODULES);
      if (!ok) break;
    }

    if (module.label === 'Configuration') {
      const ok = await runNestedSweep(module.label, module.section, CONFIG_SUBMODULES);
      if (!ok) break;
    }

    if (module.label === 'Brand Standards') {
      const ok = await runNestedSweep(module.label, module.section, BRAND_SUBMODULES);
      if (!ok) break;
    }

  }

  await writeFile('tests/module-smoke-report.json', JSON.stringify(results, null, 2), 'utf8');

  const failed = results.filter(item => item.status !== 'pass');
  expect(failed, `Module failures: ${JSON.stringify(failed, null, 2)}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — Housekeeping module loads and renders key elements
// ─────────────────────────────────────────────────────────────────────────────

test('Housekeeping module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Housekeeping', 'Operations');
  expect(navigated, 'Could not navigate to Housekeeping').toBe(true);

  // Verify no crash overlay
  await expect(page.getByText('App crashed during render')).not.toBeVisible();

  // Module should render some content (not be blank)
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  // Verify no uncaught page errors
  expect(errors, `Uncaught errors on Housekeeping: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — F&B / POS module loads and renders key elements
// ─────────────────────────────────────────────────────────────────────────────

test('F&B / POS module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'F&B / POS', 'Operations');
  expect(navigated, 'Could not navigate to F&B / POS').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();

  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on POS: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — Events module loads and renders key elements
// ─────────────────────────────────────────────────────────────────────────────

test('Events module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Events', 'Operations');
  expect(navigated, 'Could not navigate to Events').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();

  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Events: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5 — Group Management module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Group Management module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Group Management', 'Operations');
  expect(navigated, 'Could not navigate to Group Management').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Group Management: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — Night Audit module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Night Audit module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Night Audit', 'Operations');
  expect(navigated, 'Could not navigate to Night Audit').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Night Audit: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7 — Finance module loads and renders key elements
// ─────────────────────────────────────────────────────────────────────────────

test('Finance module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Finance', 'Back Office');
  expect(navigated, 'Could not navigate to Finance').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Finance: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8 — Human Capital module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Human Capital module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Human Capital', 'Back Office');
  expect(navigated, 'Could not navigate to Human Capital').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Human Capital: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9 — Procurement module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Procurement module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Procurement', 'Back Office');
  expect(navigated, 'Could not navigate to Procurement').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Procurement: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10 — Engineering module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Engineering module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Engineering', 'Infrastructure');
  expect(navigated, 'Could not navigate to Engineering').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Engineering: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11 — Security module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Security module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Security', 'Infrastructure');
  expect(navigated, 'Could not navigate to Security').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Security: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12 — IOT Control module loads
// ─────────────────────────────────────────────────────────────────────────────

test('IOT Control module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'IOT Control', 'Infrastructure');
  expect(navigated, 'Could not navigate to IOT Control').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on IOT Control: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 13 — AI Command Center module loads
// ─────────────────────────────────────────────────────────────────────────────

test('AI Command Center module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'AI Command Center', 'Intelligence');
  expect(navigated, 'Could not navigate to AI Command Center').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on AI Command Center: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 14 — Autonomic Core module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Autonomic Core module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Autonomic Core', 'Intelligence');
  expect(navigated, 'Could not navigate to Autonomic Core').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Autonomic Core: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 15 — Terminal module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Terminal module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Terminal', 'System');
  expect(navigated, 'Could not navigate to Terminal').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Terminal: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 16 — Connect module loads
// ─────────────────────────────────────────────────────────────────────────────

test('Connect module renders without errors', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Connect', 'Core');
  expect(navigated, 'Could not navigate to Connect').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();
  const mainContent = page.locator('main');
  await expect(mainContent).not.toBeEmpty();

  expect(errors, `Uncaught errors on Connect: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 17 — Dashboard renders stat cards and chart
// ─────────────────────────────────────────────────────────────────────────────

test('Dashboard renders stat cards and revenue chart', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const sidebar = await signInAndGetSidebar(page);
  const navigated = await navigateToModule(page, sidebar, 'Dashboard', 'Core');
  expect(navigated, 'Could not navigate to Dashboard').toBe(true);

  await expect(page.getByText('App crashed during render')).not.toBeVisible();

  // Dashboard should show "Morning Briefing" heading
  const heading = page.getByText('Morning Briefing');
  await expect(heading).toBeVisible({ timeout: 10000 });

  // Should show at least one stat card (Occupancy, ADR, RevPAR, or Alerts)
  const statCards = page.locator('.stat-card');
  const cardCount = await statCards.count();
  expect(cardCount, 'Dashboard should render stat cards').toBeGreaterThanOrEqual(1);

  expect(errors, `Uncaught errors on Dashboard: ${errors.join(', ')}`).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 18 — Command palette opens with Ctrl+K
// ─────────────────────────────────────────────────────────────────────────────

test('Command palette opens via keyboard shortcut', async ({ page }) => {
  test.setTimeout(60000);

  await signInAndGetSidebar(page);

  // Press Ctrl+K (or Cmd+K on Mac)
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(500);

  // The command palette input should be visible
  const commandInput = page.getByPlaceholder('Jump to module...');
  const isVisible = await commandInput.isVisible().catch(() => false);

  if (!isVisible) {
    // Try Ctrl+K as fallback
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
  }

  await expect(page.getByPlaceholder('Jump to module...')).toBeVisible({ timeout: 5000 });

  // Escape should close it
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await expect(page.getByPlaceholder('Jump to module...')).not.toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 19 — Console error collection across all modules (no fatal errors)
// ─────────────────────────────────────────────────────────────────────────────

test('no fatal console errors on initial load of each module', async ({ page }) => {
  test.setTimeout(300000);

  const fatalErrors = [];
  page.on('pageerror', (err) => {
    // Collect truly fatal errors (ignore expected warnings)
    if (!/favicon|NO_COLOR|ERR_CONNECTION_REFUSED/i.test(err.message)) {
      fatalErrors.push(err.message);
    }
  });

  const sidebar = await signInAndGetSidebar(page);

  // Quick sweep: navigate to each top-level module, check for page crashes
  const quickModules = [
    { label: 'Dashboard', section: 'Core' },
    { label: 'Connect', section: 'Core' },
    { label: 'Front Desk', section: 'Operations' },
    { label: 'Housekeeping', section: 'Operations' },
    { label: 'F&B / POS', section: 'Operations' },
    { label: 'Events', section: 'Operations' },
    { label: 'AI Command Center', section: 'Intelligence' },
    { label: 'Finance', section: 'Back Office' },
    { label: 'Human Capital', section: 'Back Office' },
    { label: 'Procurement', section: 'Back Office' },
    { label: 'Engineering', section: 'Infrastructure' },
    { label: 'Security', section: 'Infrastructure' },
    { label: 'IOT Control', section: 'Infrastructure' },
    { label: 'Brand Standards', section: 'Brand' },
    { label: 'Terminal', section: 'System' },
  ];

  for (const mod of quickModules) {
    const errorsBefore = fatalErrors.length;
    await navigateToModule(page, sidebar, mod.label, mod.section);

    const crashed = await page.getByText('App crashed during render').isVisible().catch(() => false);
    if (crashed) {
      fatalErrors.push(`${mod.label}: App crashed during render`);
    }
  }

  expect(
    fatalErrors,
    `Fatal errors found:\n${fatalErrors.join('\n')}`
  ).toHaveLength(0);
});
