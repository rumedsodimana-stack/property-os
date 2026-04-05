import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const targetsPath = path.join(projectRoot, 'docs/ops/hotel_target_list_2026-03-31.json');
const outputPath = path.join(projectRoot, 'output/hotel_outreach_drafts_2026-03-31.md');

const raw = await readFile(targetsPath, 'utf8');
const targets = JSON.parse(raw);

const header = `# Hotel Outreach Drafts

Generated: 2026-03-31

Purpose: first-touch outreach drafts for the Hotel AI Reservations + Concierge Pilot.
`;

const sections = targets.map((target, index) => {
  const subject = `${target.company}: quick idea to recover missed reservations and upsells`;
  const email = `Hi ${target.company} team,

${target.personalization}

I build hotel-specific AI pilots that help properties capture reservation demand after hours, answer repeat guest questions faster, route service requests into operations, and surface paid upsells like early check-in, room upgrades, late checkout, breakfast, parking, and spa add-ons.

I already have a hotel operations stack running with concierge logic, guest request routing, payments, and property workflows. I am offering a fixed-scope 14-day pilot for groups that want a faster path to direct revenue and reduced front desk load without a long implementation cycle.

For ${target.company}, I would position this as a ${target.pitch_angle.toLowerCase()}.

If useful, I can send a short 3-point pilot outline tailored to your properties this week.

Best,
<your name>`;

  const shortDm = `Hi ${target.company} team, I build hotel AI pilots that recover missed reservations, automate guest messaging, and drive upsells. ${target.personalization} I think there is a strong fit for a 14-day pilot. Open to a short note with the idea?`;

  return `## ${index + 1}. ${target.company}

- Market: ${target.market}
- Segment: ${target.segment}
- Website: ${target.website}
- Contact URL: ${target.contact_url}
- Contact email: ${target.contact_email}
- Phone: ${target.phone}
- Expected ticket: USD ${target.expected_ticket_usd}
- Source: ${target.source_url}

### Subject

${subject}

### Email

${email}

### Short DM

${shortDm}
`;
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${header}\n${sections.join('\n')}`, 'utf8');

console.log(`Generated ${outputPath}`);
