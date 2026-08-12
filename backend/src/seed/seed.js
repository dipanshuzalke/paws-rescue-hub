import { env } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";

import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { RescueReport } from "../models/RescueReport.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { Notification } from "../models/Notification.js";

const FRESH = process.argv.includes("--fresh");
const PASSWORD = env.seedPassword;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function daysAgo(n) {
  return new Date(Date.now() - n * DAY);
}

function placeholderImage(seed, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// ---------------------------------------------------------------------------
// Static reference data — mirrors the Phase 1 frontend mock data so the demo
// content lines up with the existing UI (Nagpur, Maharashtra).
// ---------------------------------------------------------------------------

const AREAS = [
  { area: "Dharampeth", lat: 21.1385, lng: 79.0625 },
  { area: "Sadar", lat: 21.1585, lng: 79.0855 },
  { area: "Sitabuldi", lat: 21.1462, lng: 79.0805 },
  { area: "Manish Nagar", lat: 21.0876, lng: 79.0688 },
  { area: "Bajaj Nagar", lat: 21.1229, lng: 79.0453 },
  { area: "Wardha Road", lat: 21.1082, lng: 79.0491 },
  { area: "Civil Lines", lat: 21.1521, lng: 79.0782 },
  { area: "Trimurti Nagar", lat: 21.1298, lng: 79.0389 },
];

function pointFor(area) {
  // GeoJSON order is [longitude, latitude]
  return { type: "Point", coordinates: [area.lng, area.lat] };
}

const ORG_SEEDS = [
  {
    name: "Helping Paws NGO",
    description:
      "Nagpur-based animal welfare organisation running a 24x7 ambulance service and a 40-bed shelter for injured strays.",
    email: "contact@helpingpaws.org",
    phone: "+91 98220 41255",
    address: "Shankar Nagar Square, Dharampeth, Nagpur 440010",
    area: AREAS[0],
    website: "https://helpingpaws.org",
    verificationStatus: "VERIFIED",
    coordinator: {
      name: "Meera Deshmukh",
      email: "ngo@demo.com",
      phone: "+91 98220 41255",
    },
  },
  {
    name: "Nagpur Animal Aid Trust",
    description: "Trust focused on road-accident rescues, sterilisation drives and post-operative care for street dogs.",
    email: "help@naat.org.in",
    phone: "+91 91456 77210",
    address: "Mount Road, Sadar, Nagpur 440001",
    area: AREAS[1],
    website: "https://naat.org.in",
    verificationStatus: "VERIFIED",
    coordinator: {
      name: "Arjun Kale",
      email: "arjun.kale@naat.org.in",
      phone: "+91 91456 77210",
    },
  },
  {
    name: "Karuna Animal Shelter",
    description: "Community shelter offering foster placement for abandoned pups, kittens and injured cattle.",
    email: "info@karunashelter.in",
    phone: "+91 99700 31188",
    address: "Lane 3, Manish Nagar, Nagpur 440037",
    area: AREAS[3],
    website: "https://karunashelter.in",
    verificationStatus: "PENDING",
    coordinator: {
      name: "Sneha Bhatt",
      email: "sneha.bhatt@karunashelter.in",
      phone: "+91 99700 31188",
    },
  },
];

const RESCUER_SEEDS = [
  { name: "Rahul Sharma", email: "rescuer@demo.com", phone: "+91 98765 43210", org: 0, area: AREAS[0], availability: "AVAILABLE", completedCases: 48, activeCases: 2, totalResponseMins: 528, ratedResponses: 48, rating: 4.9 },
  { name: "Priya Patil", email: "priya.patil@helpingpaws.org", phone: "+91 98220 11245", org: 0, area: AREAS[1], availability: "AVAILABLE", completedCases: 35, activeCases: 1, totalResponseMins: 490, ratedResponses: 35, rating: 4.7 },
  { name: "Neha Kulkarni", email: "neha.kulkarni@helpingpaws.org", phone: "+91 90211 44329", org: 0, area: AREAS[4], availability: "OFFLINE", completedCases: 41, activeCases: 0, totalResponseMins: 779, ratedResponses: 41, rating: 4.4 },
  { name: "Amit Deshpande", email: "amit.deshpande@naat.org.in", phone: "+91 91456 90031", org: 1, area: AREAS[2], availability: "AVAILABLE", completedCases: 63, activeCases: 1, totalResponseMins: 819, ratedResponses: 63, rating: 4.6 },
  { name: "Farhan Qureshi", email: "farhan.qureshi@naat.org.in", phone: "+91 97640 88123", org: 1, area: AREAS[1], availability: "OFFLINE", completedCases: 12, activeCases: 0, totalResponseMins: 336, ratedResponses: 12, rating: 4.1 },
  { name: "Vikas Meshram", email: "vikas.meshram@naat.org.in", phone: "+91 98903 22157", org: 1, area: AREAS[5], availability: "BUSY", completedCases: 116, activeCases: 2, totalResponseMins: 2552, ratedResponses: 116, rating: 4.8 },
  { name: "Sneha Bhatt", email: "sneha.bhatt.rescuer@karunashelter.in", phone: "+91 99700 31199", org: 2, area: AREAS[3], availability: "AVAILABLE", completedCases: 27, activeCases: 0, totalResponseMins: 567, ratedResponses: 27, rating: 4.5 },
  { name: "Ritu Chandak", email: "ritu.chandak@karunashelter.in", phone: "+91 89830 55710", org: 2, area: AREAS[3], availability: "AVAILABLE", completedCases: 54, activeCases: 1, totalResponseMins: 864, ratedResponses: 54, rating: 4.7 },
  { name: "Sanjay Rathod", email: "sanjay.rathod@karunashelter.in", phone: "+91 94220 76644", org: 2, area: AREAS[2], availability: "AVAILABLE", completedCases: 23, activeCases: 0, totalResponseMins: 414, ratedResponses: 23, rating: 4.3 },
  { name: "Imran Sheikh", email: "imran.sheikh@helpingpaws.org", phone: "+91 93705 66421", org: 0, area: AREAS[5], availability: "BUSY", completedCases: 89, activeCases: 3, totalResponseMins: 1513, ratedResponses: 89, rating: 4.8 },
];

const CITIZEN_SEEDS = [
  { name: "Rahul Verma", email: "citizen@demo.com", phone: "+91 98812 33440", area: AREAS[0] },
  { name: "Ananya Joshi", email: "ananya.joshi@gmail.com", phone: "+91 90967 21188", area: AREAS[1] },
  { name: "Kunal Bhosale", email: "kunal.bhosale@outlook.com", phone: "+91 91720 55613", area: AREAS[3] },
  { name: "Fatima Ansari", email: "fatima.ansari@gmail.com", phone: "+91 98501 77320", area: AREAS[2] },
  { name: "Tejas Ingle", email: "tejas.ingle@gmail.com", phone: "+91 87660 90014", area: AREAS[4] },
  { name: "Shreya Nandanwar", email: "shreya.nandanwar@gmail.com", phone: "+91 93261 40077", area: AREAS[5] },
  { name: "Pooja Ramteke", email: "pooja.ramteke@gmail.com", phone: "+91 99999 00002", area: AREAS[6] },
  { name: "Devendra Wankhede", email: "devendra.wankhede@gmail.com", phone: "+91 96040 12233", area: AREAS[7] },
  { name: "Aarti Sahu", email: "aarti.sahu@gmail.com", phone: "+91 90210 55667", area: AREAS[6] },
  { name: "Nikhil Bawankar", email: "nikhil.bawankar@gmail.com", phone: "+91 88884 11223", area: AREAS[7] },
];

const ANIMAL_TYPES = ["DOG", "CAT", "COW", "BIRD", "OTHER"];
const CONDITIONS = ["INJURED", "SICK", "ABANDONED", "TRAPPED", "ACCIDENT", "STARVING", "OTHER"];
const EMERGENCY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

// One seed entry per report — status distributed to cover every value.
const REPORT_SEEDS = [
  { status: "REPORTED", animalType: "DOG", condition: "INJURED", emergency: "CRITICAL", area: AREAS[0], daysAgo: 0.1, title: "Injured dog near market signal", description: "Street dog hit by a two-wheeler near the Dharampeth market signal. The right hind leg is bleeding and the dog cannot stand." },
  { status: "REPORTED", animalType: "CAT", condition: "TRAPPED", emergency: "HIGH", area: AREAS[1], daysAgo: 0.3, title: "Kitten trapped in drainage pit", description: "A kitten has fallen into an open drainage pit behind the Sadar bus stop. It is crying continuously." },
  { status: "REPORTED", animalType: "BIRD", condition: "INJURED", emergency: "MEDIUM", area: AREAS[6], daysAgo: 0.5, title: "Pigeon caught in kite string", description: "A pigeon is entangled in manja near a terrace in Civil Lines and cannot free its wing." },
  { status: "ASSIGNED", animalType: "COW", condition: "ACCIDENT", emergency: "CRITICAL", area: AREAS[5], daysAgo: 1, title: "Cow hit on highway service road", description: "A cow was struck by a tempo on the Wardha Road service lane and cannot get up.", rescuerIdx: 5 },
  { status: "ASSIGNED", animalType: "DOG", condition: "SICK", emergency: "MEDIUM", area: AREAS[7], daysAgo: 1.5, title: "Dog with severe mange", description: "A stray dog near Trimurti Nagar has heavy mange and open wounds on the back.", rescuerIdx: 8 },
  { status: "ACCEPTED", animalType: "DOG", condition: "ABANDONED", emergency: "MEDIUM", area: AREAS[3], daysAgo: 2, title: "Puppies abandoned in a box", description: "Four newborn puppies left in a cardboard box near a shop shutter in Manish Nagar.", rescuerIdx: 6 },
  { status: "ACCEPTED", animalType: "CAT", condition: "SICK", emergency: "LOW", area: AREAS[4], daysAgo: 2.5, title: "Cat with eye infection", description: "A stray cat with badly swollen eyes has been visiting a house in Bajaj Nagar for food.", rescuerIdx: 2 },
  { status: "IN_PROGRESS", animalType: "DOG", condition: "ACCIDENT", emergency: "CRITICAL", area: AREAS[1], daysAgo: 3, title: "Dog hit near Sadar flyover", description: "Adult dog hit by a car under the Sadar flyover, unable to move front legs.", rescuerIdx: 3 },
  { status: "IN_PROGRESS", animalType: "COW", condition: "SICK", emergency: "HIGH", area: AREAS[2], daysAgo: 3.5, title: "Cow unable to stand near market", description: "A cow has been sitting at the same spot for two days near the Sitabuldi vegetable market.", rescuerIdx: 3 },
  { status: "IN_PROGRESS", animalType: "OTHER", condition: "INJURED", emergency: "HIGH", area: AREAS[5], daysAgo: 4, title: "Injured monkey on terrace", description: "A monkey with a wounded arm has been sitting on a terrace parapet in Wardha Road.", rescuerIdx: 9 },
  { status: "RESCUED", animalType: "BIRD", condition: "INJURED", emergency: "HIGH", area: AREAS[2], daysAgo: 5, title: "Pigeon injured by kite string", description: "Pigeon caught in manja near a terrace in Sitabuldi with a cut wing.", rescuerIdx: 8, rescueDurationMins: 74 },
  { status: "RESCUED", animalType: "CAT", condition: "ABANDONED", emergency: "LOW", area: AREAS[3], daysAgo: 6, title: "Kittens left near society gate", description: "Two kittens left near the society gate in Manish Nagar, healthy but need shelter.", rescuerIdx: 6, rescueDurationMins: 96 },
  { status: "CLOSED", animalType: "DOG", condition: "SICK", emergency: "MEDIUM", area: AREAS[4], daysAgo: 8, title: "Dog with skin infection", description: "A stray dog near the Bajaj Nagar garden has heavy mange and open wounds.", rescuerIdx: 1, rescueDurationMins: 128 },
  { status: "CLOSED", animalType: "DOG", condition: "TRAPPED", emergency: "MEDIUM", area: AREAS[4], daysAgo: 12, title: "Dog stuck between compound walls", description: "A young dog slipped into the narrow gap between two compound walls in Bajaj Nagar.", rescuerIdx: 1, rescueDurationMins: 52 },
  { status: "CLOSED", animalType: "COW", condition: "OTHER", emergency: "LOW", area: AREAS[2], daysAgo: 15, title: "Cattle blocking traffic", description: "Two cows have settled in the middle of the road near Sitabuldi causing traffic jams.", rescuerIdx: 3, rescueDurationMins: 70, animalCount: 2 },
  { status: "CLOSED", animalType: "DOG", condition: "ACCIDENT", emergency: "CRITICAL", area: AREAS[5], daysAgo: 20, title: "Dog trapped under parked truck", description: "A dog crawled under a parked truck near Wardha Road after an accident and is bleeding heavily.", rescuerIdx: 5, rescueDurationMins: 55 },
  { status: "CLOSED", animalType: "BIRD", condition: "TRAPPED", emergency: "LOW", area: AREAS[3], daysAgo: 25, title: "Owl trapped in badminton net", description: "A barn owl got entangled in a badminton net at a Manish Nagar sports ground overnight.", rescuerIdx: 8, rescueDurationMins: 40 },
  { status: "CLOSED", animalType: "DOG", condition: "INJURED", emergency: "HIGH", area: AREAS[7], daysAgo: 35, title: "Dog with fractured leg", description: "Stray dog limping with a visibly fractured front leg near Trimurti Nagar industrial gate.", rescuerIdx: 5, rescueDurationMins: 143 },
  { status: "CANCELLED", animalType: "DOG", condition: "ABANDONED", emergency: "LOW", area: AREAS[0], daysAgo: 40, title: "Pet dog reported as abandoned", description: "A dog was reported as abandoned near Dharampeth but the owner was traced within the hour.", cancelledReason: "Duplicate of an existing rescue request in the same area." },
  { status: "CANCELLED", animalType: "CAT", condition: "OTHER", emergency: "LOW", area: AREAS[6], daysAgo: 55, title: "Cat sighting turned out to be a false alarm", description: "Reported cat in distress near Civil Lines turned out to be resting, no rescue needed.", cancelledReason: "No animal found at the reported location." },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function wipeOwnedCollections() {
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    RescueReport.deleteMany({}),
    RescueAssignment.deleteMany({}),
    RescueHistory.deleteMany({}),
    Notification.deleteMany({}),
  ]);
}

async function createUser(fields) {
  const user = new User({
    password: PASSWORD,
    status: "ACTIVE",
    isActive: true,
    isVerified: true,
    ...fields,
  });
  await user.save();
  return user;
}

async function seedOrganizationsAndStaff() {
  const orgs = [];
  const coordinators = [];

  for (const seed of ORG_SEEDS) {
    const org = await Organization.create({
      name: seed.name,
      description: seed.description,
      email: seed.email,
      phone: seed.phone,
      address: seed.address,
      location: { ...pointFor(seed.area), address: seed.address },
      website: seed.website,
      contactPerson: seed.coordinator.name,
      verificationStatus: seed.verificationStatus,
      isActive: true,
    });

    const coordinator = await createUser({
      name: seed.coordinator.name,
      email: seed.coordinator.email,
      phone: seed.coordinator.phone,
      role: "NGO",
      organization: org._id,
      location: { ...pointFor(seed.area), address: seed.address },
    });

    org.createdBy = coordinator._id;
    await org.save();

    orgs.push(org);
    coordinators.push(coordinator);
  }

  return { orgs, coordinators };
}

async function seedRescuers(orgs) {
  const rescuers = [];
  for (const seed of RESCUER_SEEDS) {
    const rescuer = await createUser({
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      role: "RESCUER",
      organization: orgs[seed.org]._id,
      availability: seed.availability,
      activeCases: seed.activeCases,
      completedCases: seed.completedCases,
      totalResponseMins: seed.totalResponseMins,
      ratedResponses: seed.ratedResponses,
      rating: seed.rating,
      location: { ...pointFor(seed.area), address: `${seed.area.area}, Nagpur` },
    });
    rescuers.push(rescuer);
  }
  return rescuers;
}

async function seedCitizens() {
  const citizens = [];
  for (const seed of CITIZEN_SEEDS) {
    const citizen = await createUser({
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      role: "CITIZEN",
      location: { ...pointFor(seed.area), address: `${seed.area.area}, Nagpur` },
    });
    citizens.push(citizen);
  }
  return citizens;
}

async function seedAdmin() {
  return createUser({
    name: "System Administrator",
    email: "admin@demo.com",
    phone: "+91 99999 00001",
    role: "ADMIN",
    location: { type: "Point", coordinates: [79.0882, 21.1458], address: "Nagpur, Maharashtra" },
  });
}

function pickReporter(citizens, index) {
  return citizens[index % citizens.length];
}

function rescuerOrgId(rescuer) {
  return rescuer.organization;
}

/** Builds and persists one report plus its assignment / history / notifications. */
async function seedReport(seed, index, { citizens, rescuers, admin }) {
  const reporter = pickReporter(citizens, index);
  const reportedAt = daysAgo(seed.daysAgo);

  const rescuer = seed.rescuerIdx !== undefined ? rescuers[seed.rescuerIdx] : null;

  const report = await RescueReport.create({
    reporter: reporter._id,
    title: seed.title,
    animalType: seed.animalType,
    animalCount: seed.animalCount || 1,
    condition: seed.condition,
    emergencyLevel: seed.emergency,
    description: seed.description,
    images: [
      { url: placeholderImage(`resqpaws-${index}-a`), width: 800, height: 600, format: "jpg" },
      { url: placeholderImage(`resqpaws-${index}-b`), width: 800, height: 600, format: "jpg" },
    ],
    location: pointFor(seed.area),
    address: `${seed.area.area}, Nagpur, Maharashtra`,
    area: seed.area.area,
    city: "Nagpur",
    status: "REPORTED",
    reportedAt,
    isPublic: true,
  });

  const history = [
    { previousStatus: "NONE", newStatus: "REPORTED", timestamp: reportedAt, changedBy: reporter, note: "Report created" },
  ];

  const notifications = [];

  if (seed.status === "REPORTED") {
    report.status = "REPORTED";
    await report.save();
    notifications.push({
      recipient: reporter._id,
      report: report._id,
      type: "NEW_REPORT",
      title: "Your report has been received",
      message: `Your ${seed.animalType.toLowerCase()} report is awaiting assignment.`,
      emergencyLevel: seed.emergency,
    });
    await RescueHistory.insertMany(history.map((h) => toHistoryDoc(h, report)));
    await Notification.insertMany(notifications);
    return report;
  }

  // Past REPORTED: create an assignment chain.
  const assignedAt = new Date(reportedAt.getTime() + 20 * MINUTE);
  const acceptedAt = new Date(assignedAt.getTime() + 10 * MINUTE);
  const startedAt = new Date(acceptedAt.getTime() + 15 * MINUTE);
  const rescueDurationMins = seed.rescueDurationMins || 60;
  const rescuedAt = new Date(startedAt.getTime() + rescueDurationMins * MINUTE);
  const closedAt = new Date(rescuedAt.getTime() + 30 * MINUTE);

  report.assignedRescuer = rescuer ? rescuer._id : null;
  report.assignedOrganization = rescuer ? rescuerOrgId(rescuer) : null;

  const assignment = rescuer
    ? await RescueAssignment.create({
        report: report._id,
        rescuer: rescuer._id,
        organization: rescuerOrgId(rescuer),
        assignedBy: admin._id,
        status: mapAssignmentStatus(seed.status),
        assignedAt,
        acceptedAt: statusAtLeast(seed.status, "ACCEPTED") ? acceptedAt : undefined,
        startedAt: statusAtLeast(seed.status, "IN_PROGRESS") ? startedAt : undefined,
        completedAt: statusAtLeast(seed.status, "RESCUED") ? rescuedAt : undefined,
      })
    : null;

  if (assignment) report.assignment = assignment._id;

  report.status = seed.status;
  report.assignedAt = assignedAt;

  if (seed.status === "CANCELLED") {
    report.cancelledReason = seed.cancelledReason || "Cancelled by reporter";
    report.closedAt = new Date(assignedAt.getTime() + 5 * MINUTE);
    history.push({ previousStatus: "REPORTED", newStatus: "CANCELLED", timestamp: report.closedAt, changedBy: reporter, note: report.cancelledReason });
  } else {
    history.push({ previousStatus: "REPORTED", newStatus: "ASSIGNED", timestamp: assignedAt, changedBy: admin, note: `Assigned to ${rescuer.name}` });

    if (statusAtLeast(seed.status, "ACCEPTED")) {
      report.acceptedAt = acceptedAt;
      history.push({ previousStatus: "ASSIGNED", newStatus: "ACCEPTED", timestamp: acceptedAt, changedBy: rescuer, note: "Rescuer accepted the case" });
      notifications.push({
        recipient: reporter._id,
        report: report._id,
        type: "RESCUE_ACCEPTED",
        title: "A rescuer has accepted your report",
        message: `${rescuer.name} is on the way to help`,
        emergencyLevel: seed.emergency,
      });
    }
    if (statusAtLeast(seed.status, "IN_PROGRESS")) {
      report.startedAt = startedAt;
      history.push({ previousStatus: "ACCEPTED", newStatus: "IN_PROGRESS", timestamp: startedAt, changedBy: rescuer, note: "Rescue operation started" });
      notifications.push({
        recipient: reporter._id,
        report: report._id,
        type: "RESCUE_STARTED",
        title: "Rescue in progress",
        message: `${rescuer.name} has started the rescue operation`,
        emergencyLevel: seed.emergency,
      });
    }
    if (statusAtLeast(seed.status, "RESCUED")) {
      report.rescuedAt = rescuedAt;
      report.rescueImages = [{ url: placeholderImage(`resqpaws-proof-${index}`), width: 800, height: 600, format: "jpg" }];
      history.push({ previousStatus: "IN_PROGRESS", newStatus: "RESCUED", timestamp: rescuedAt, changedBy: rescuer, note: "Animal safely rescued" });
      notifications.push({
        recipient: reporter._id,
        report: report._id,
        type: "RESCUE_COMPLETED",
        title: "Rescue completed",
        message: `${rescuer.name} has completed the rescue`,
        emergencyLevel: seed.emergency,
      });
    }
    if (statusAtLeast(seed.status, "CLOSED")) {
      report.closedAt = closedAt;
      history.push({ previousStatus: "RESCUED", newStatus: "CLOSED", timestamp: closedAt, changedBy: admin, note: "Case closed after follow-up" });
    }

    if (rescuer) {
      notifications.push({
        recipient: rescuer._id,
        report: report._id,
        type: "ASSIGNMENT",
        title: "New rescue assignment",
        message: `You have been assigned a ${seed.emergency} priority case in ${seed.area.area}`,
        emergencyLevel: seed.emergency,
      });
    }
  }

  await report.save();
  await RescueHistory.insertMany(history.map((h) => toHistoryDoc(h, report)));
  if (notifications.length) await Notification.insertMany(notifications);

  return report;
}

function toHistoryDoc(h, report) {
  return {
    report: report._id,
    changedBy: h.changedBy?._id || null,
    changedByName: h.changedBy?.name || "System",
    changedByRole: h.changedBy?.role || "SYSTEM",
    previousStatus: h.previousStatus,
    newStatus: h.newStatus,
    note: h.note || "",
    timestamp: h.timestamp,
  };
}

const STATUS_ORDER = ["REPORTED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "RESCUED", "CLOSED"];

function statusAtLeast(status, target) {
  if (status === "CANCELLED") return false;
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(target);
}

function mapAssignmentStatus(reportStatus) {
  switch (reportStatus) {
    case "ASSIGNED":
      return "ASSIGNED";
    case "ACCEPTED":
      return "ACCEPTED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "RESCUED":
    case "CLOSED":
      return "COMPLETED";
    default:
      return "ASSIGNED";
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  await connectDatabase();

  const existingUsers = await User.countDocuments({});
  if (existingUsers > 0 && !FRESH) {
    console.log(`[seed] Database already has ${existingUsers} user(s). Re-run with --fresh to wipe and reseed.`);
    await disconnectDatabase();
    process.exit(0);
  }

  if (FRESH) {
    console.log("[seed] --fresh flag detected — wiping owned collections...");
    await wipeOwnedCollections();
  }

  console.log("[seed] Creating admin...");
  const admin = await seedAdmin();

  console.log("[seed] Creating organizations and NGO coordinators...");
  const { orgs, coordinators } = await seedOrganizationsAndStaff();

  console.log("[seed] Creating rescuers...");
  const rescuers = await seedRescuers(orgs);

  console.log("[seed] Creating citizens...");
  const citizens = await seedCitizens();

  console.log("[seed] Creating rescue reports, assignments, history and notifications...");
  const reports = [];
  for (let i = 0; i < REPORT_SEEDS.length; i += 1) {
    const report = await seedReport(REPORT_SEEDS[i], i, { citizens, rescuers, admin });
    reports.push(report);
  }

  const statusCounts = REPORT_SEEDS.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  console.log("\n================= Seed summary =================");
  console.log(`Admins:        1`);
  console.log(`Organizations: ${orgs.length} (${orgs.map((o) => o.verificationStatus).join(", ")})`);
  console.log(`NGO users:     ${coordinators.length}`);
  console.log(`Rescuers:      ${rescuers.length}`);
  console.log(`Citizens:      ${citizens.length}`);
  console.log(`Reports:       ${reports.length}`);
  console.log(`  by status:   ${JSON.stringify(statusCounts)}`);
  console.log("==================================================\n");

  console.log("Demo credentials (all use the same password):");
  console.table([
    { role: "ADMIN", email: "admin@demo.com", password: PASSWORD },
    { role: "NGO", email: "ngo@demo.com", password: PASSWORD },
    { role: "RESCUER", email: "rescuer@demo.com", password: PASSWORD },
    { role: "CITIZEN", email: "citizen@demo.com", password: PASSWORD },
  ]);

  await disconnectDatabase();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("[seed] Failed:", error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
