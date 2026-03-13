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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

  const clickButton = async (button) => {
    if (!(await button.count())) {
      return false;
    }
    await button.evaluate((node) => node.scrollIntoView({ block: 'nearest' }));

    const isActive = (await button.getAttribute('data-active')) === 'true';
    if (isActive) {
      return true;
    }

    await button.evaluate((node) => node.click());
    return true;
  };

  const getModuleButton = (label) =>
    sidebar.locator(`button.os-nav-item[aria-label="${label}"]`).first();

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

      let navButton = getModuleButton(moduleLabel);
      if (!(await navButton.count())) {
        await toggleSection(sectionName);
        navButton = getModuleButton(moduleLabel);
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

  const toggleSection = async (sectionName) => {
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
  };

  for (const module of MODULES) {
    let navButton = getModuleButton(module.label);

    const pageErrorStart = pageErrors.length;
    const consoleErrorStart = consoleErrors.length;

    if (!(await navButton.count())) {
      await toggleSection(module.section);
      navButton = getModuleButton(module.label);
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
