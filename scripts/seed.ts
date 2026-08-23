/**
 * Creates a demo dataset: one admin (James), four sample staff, two sample
 * events with shifts (including one left open), a time off request, and a
 * welcome notification. Safe to re-run — it skips seeding if the admin
 * account already exists.
 *
 * Run with: npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

// Next.js loads .env automatically; a plain script run via `tsx` doesn't, so
// load it here (a tiny hand-rolled parser to avoid an extra dependency).
//
// This has to happen before the db-touching modules below are imported,
// since they construct the Postgres pool from DATABASE_URL at import time.
// A static `import` of those modules would get hoisted above this code by
// the TS/CJS transpiler regardless of where it's written in the file, so
// they're loaded with a dynamic `import()` inside main() instead, after
// loadEnvFile() has already run.
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function hash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  loadEnvFile();

  const { createUser, findUserByEmail } = await import("../src/lib/queries/users");
  const { createEvent } = await import("../src/lib/queries/events");
  const { createShift } = await import("../src/lib/queries/shifts");
  const { createTimeOff } = await import("../src/lib/queries/timeOff");
  const { createNotification } = await import("../src/lib/queries/notifications");

  console.log("Seeding Digbys BOH...\n");

  if (await findUserByEmail("james@digbysevents.co.uk")) {
    console.log("Database already has data (james@digbysevents.co.uk exists) — skipping.");
    console.log("Wipe the tables in your Postgres database and re-run `npm run db:seed` for a fresh demo dataset.");
    return;
  }

  const adminPassword = "digbys-admin-2026";
  const admin = await createUser({
    name: "James",
    email: "james@digbysevents.co.uk",
    passwordHash: hash(adminPassword),
    role: "ADMIN",
    position: "Owner",
    mustChangePassword: true,
  });

  const staffPassword = "digbys-staff-2026";
  const staffSeed = [
    { name: "Ellie Marsh", email: "ellie@digbysevents.co.uk", position: "Bar Supervisor", rate: 13.5 },
    { name: "Tom Whitfield", email: "tom@digbysevents.co.uk", position: "Bartender", rate: 12 },
    { name: "Priya Chandra", email: "priya@digbysevents.co.uk", position: "Waiting Staff", rate: 11.5 },
    { name: "Sam O'Neill", email: "sam@digbysevents.co.uk", position: "Chef de Partie", rate: 14.75 },
  ];

  const staff = [];
  for (const s of staffSeed) {
    staff.push(
      await createUser({
        name: s.name,
        email: s.email,
        passwordHash: hash(staffPassword),
        role: "STAFF",
        position: s.position,
        hourlyRatePence: Math.round(s.rate * 100),
        mustChangePassword: true,
      })
    );
  }

  const t = today();

  const event1 = await createEvent({
    name: "Hartley Wedding",
    clientName: "Charlotte & Ben Hartley",
    location: "The Barn at Longmead",
    address: "Longmead Farm, Henley Rd, Henley-on-Thames RG9 1AB",
    eventDate: addDays(t, 6),
    startTime: "13:00",
    endTime: "23:30",
    guestCount: 120,
    notes:
      "Access round the back via the gravel track. Client wants the Champagne reception ready for 1pm sharp.",
    status: "CONFIRMED",
    createdBy: admin.id,
  });

  const event2 = await createEvent({
    name: "Whitmore & Co Summer Party",
    clientName: "Whitmore & Co",
    location: "Digbys Riverside Marquee",
    address: "Mill Lane, Marlow SL7 1QA",
    eventDate: addDays(t, 13),
    startTime: "18:00",
    endTime: "00:00",
    guestCount: 80,
    status: "CONFIRMED",
    createdBy: admin.id,
  });

  await createShift({
    eventId: event1.id,
    title: "Bar staff",
    location: event1.location,
    shiftDate: event1.eventDate,
    startTime: "11:30",
    endTime: "23:30",
    assignedUserId: staff[0].id,
    createdBy: admin.id,
  });
  await createShift({
    eventId: event1.id,
    title: "Bar staff",
    location: event1.location,
    shiftDate: event1.eventDate,
    startTime: "12:00",
    endTime: "22:00",
    assignedUserId: staff[1].id,
    createdBy: admin.id,
  });
  const openShift = await createShift({
    eventId: event1.id,
    title: "Waiting staff",
    location: event1.location,
    shiftDate: event1.eventDate,
    startTime: "12:00",
    endTime: "22:00",
    createdBy: admin.id, // left OPEN on purpose, for the Open Shifts demo
  });
  await createShift({
    eventId: event1.id,
    title: "Chef de partie",
    location: event1.location,
    shiftDate: event1.eventDate,
    startTime: "09:00",
    endTime: "20:00",
    assignedUserId: staff[3].id,
    createdBy: admin.id,
  });

  // A shift today so the Time Clock page has something to clock in to.
  await createShift({
    title: "Bar staff",
    location: "Digbys Warehouse Bar",
    shiftDate: t,
    startTime: "09:00",
    endTime: "17:00",
    assignedUserId: staff[2].id,
    createdBy: admin.id,
  });

  // Summer party — both roles left open.
  await createShift({
    eventId: event2.id,
    title: "Bar staff",
    location: event2.location,
    shiftDate: event2.eventDate,
    startTime: "17:00",
    endTime: "00:30",
    createdBy: admin.id,
  });
  await createShift({
    eventId: event2.id,
    title: "Waiting staff",
    location: event2.location,
    shiftDate: event2.eventDate,
    startTime: "17:00",
    endTime: "00:30",
    createdBy: admin.id,
  });

  await createTimeOff({
    userId: staff[1].id,
    startDate: addDays(t, 20),
    endDate: addDays(t, 24),
    reason: "Family holiday",
  });

  await createNotification({
    userId: admin.id,
    type: "SHIFT_OPEN",
    title: "Welcome to Digbys BOH",
    body: "This is a sample notification — open shifts and time-off requests will show up here.",
    link: "/shifts/open",
  });

  console.log("Done. Demo data created.\n");
  console.log("Admin login");
  console.log("  email:    james@digbysevents.co.uk");
  console.log(`  password: ${adminPassword}`);
  console.log("\nStaff logins (all share the same temporary password)");
  for (const s of staffSeed) console.log(`  ${s.email}`);
  console.log(`  password: ${staffPassword}`);
  console.log("\nEveryone is asked to set a new password the first time they sign in.");
  console.log(`\nSample open shift: "${openShift.title}" on ${openShift.shiftDate}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { pool } = await import("../src/lib/db");
    await pool.end();
  });
