import { imageForAnimal } from "@/data/images";
import type {
  AnimalType,
  Condition,
  Emergency,
  RescueReport,
  RescueStatus,
  TimelineEntry,
} from "@/types";

const STATUS_FLOW: RescueStatus[] = [
  "REPORTED",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "RESCUED",
  "CLOSED",
];

export const STATUS_LABELS: Record<RescueStatus, string> = {
  REPORTED: "Reported",
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "Rescue In Progress",
  RESCUED: "Rescued",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export function buildTimeline(
  status: RescueStatus,
  createdAt: string,
  actors: { reporter: string; ngo?: string | undefined; rescuer?: string | undefined },
  evidence?: { status: string; submittedAt?: string; verifiedAt?: string } | null,
): TimelineEntry[] {
  const start = new Date(createdAt).getTime();
  const step = 22 * 60 * 1000;
  if (status === "CANCELLED") {
    return [
      {
        status: "REPORTED",
        label: STATUS_LABELS.REPORTED,
        at: createdAt,
        by: actors.reporter,
      },
      {
        status: "CANCELLED",
        label: STATUS_LABELS.CANCELLED,
        at: new Date(start + step).toISOString(),
        by: actors.ngo ?? "Coordination desk",
        note: "Duplicate of an existing rescue request in the same area.",
      },
    ];
  }
  const reachedIndex = STATUS_FLOW.indexOf(status);
  const timeline: TimelineEntry[] = STATUS_FLOW.map((s, i) => ({
    status: s,
    label: STATUS_LABELS[s],
    at: i <= reachedIndex ? new Date(start + i * step).toISOString() : null,
    by:
      s === "REPORTED"
        ? actors.reporter
        : s === "ASSIGNED"
          ? (actors.ngo ?? "Coordination desk")
          : (actors.rescuer ?? "Rescue team"),
  }));

  // Add evidence verification timeline entries if evidence exists
  if (evidence && status === "CLOSED") {
    const evidenceSubmittedTime = evidence.submittedAt
      ? new Date(evidence.submittedAt).getTime()
      : start + 5 * step;
    const evidenceVerifiedTime = evidence.verifiedAt
      ? new Date(evidence.verifiedAt).getTime()
      : start + 6 * step;

    // Find the RESCUED entry and insert evidence entries after it
    const rescuedIndex = timeline.findIndex((t) => t.status === "RESCUED");
    if (rescuedIndex >= 0) {
      // Insert evidence submitted entry
      if (evidence.status === "VERIFIED" || evidence.status === "PENDING") {
        timeline.splice(rescuedIndex + 1, 0, {
          status: "RESCUED", // Use RESCUED as base status, but customize display
          label: "Evidence submitted",
          at: new Date(evidenceSubmittedTime).toISOString(),
          by: actors.rescuer ?? "Rescue team",
          note: "Photos and rescue details submitted for verification",
        } as unknown as TimelineEntry);
      }

      // Insert evidence verified entry if verified
      if (evidence.status === "VERIFIED") {
        timeline.splice(rescuedIndex + 2, 0, {
          status: "RESCUED", // Use RESCUED as base status
          label: "Evidence verified",
          at: new Date(evidenceVerifiedTime).toISOString(),
          by: actors.ngo ?? "Verification team",
          note: "Rescue evidence approved and case closed",
        } as unknown as TimelineEntry);
      }
    }
  }

  return timeline;
}

interface Seed {
  id: string;
  animal: AnimalType;
  count: number;
  condition: Condition;
  emergency: Emergency;
  status: RescueStatus;
  title: string;
  description: string;
  area: string;
  address: string;
  coords: [number, number];
  distanceKm: number;
  reporter: [string, string, string];
  rescuer?: [string, string];
  ngo?: [string, string];
  hoursAgo: number;
  durationMins?: number;
}

const seeds: Seed[] = [
  {
    id: "R1023",
    animal: "Dog",
    count: 1,
    condition: "Injured",
    emergency: "CRITICAL",
    status: "IN_PROGRESS",
    title: "Injured Dog",
    description:
      "Street dog hit by a two-wheeler near the Dharampeth market signal. The right hind leg is bleeding and the dog cannot stand. Traffic is heavy and the animal is lying close to the divider.",
    area: "Dharampeth",
    address: "Near Shankar Nagar Square, Dharampeth, Nagpur 440010",
    coords: [21.1385, 79.0625],
    distanceKm: 1.2,
    reporter: ["U-001", "Rahul Verma", "+91 98812 33440"],
    rescuer: ["U-101", "Rahul Sharma"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 3,
  },
  {
    id: "R1022",
    animal: "Cow",
    count: 1,
    condition: "Accident",
    emergency: "CRITICAL",
    status: "ASSIGNED",
    title: "Cow hit on highway service road",
    description:
      "A cow was struck by a tempo on the Wardha Road service lane. It is sitting on the roadside and unable to get up. Locals have placed barricades around it.",
    area: "Wardha Road",
    address: "Opposite Airport Metro Station, Wardha Road, Nagpur 440025",
    coords: [21.1082, 79.0491],
    distanceKm: 4.1,
    reporter: ["U-003", "Kunal Bhosale", "+91 91720 55613"],
    rescuer: ["U-103", "Imran Sheikh"],
    ngo: ["NGO-04", "Street Guardians Foundation"],
    hoursAgo: 5,
  },
  {
    id: "R1021",
    animal: "Cat",
    count: 1,
    condition: "Trapped",
    emergency: "HIGH",
    status: "REPORTED",
    title: "Kitten trapped in drainage pit",
    description:
      "A kitten has fallen into an open drainage pit behind the Sadar bus stop. It is crying continuously and the pit is around six feet deep.",
    area: "Sadar",
    address: "Behind Sadar Bus Stop, Nagpur 440001",
    coords: [21.1585, 79.0855],
    distanceKm: 2.7,
    reporter: ["U-002", "Ananya Joshi", "+91 90967 21188"],
    hoursAgo: 1,
  },
  {
    id: "R1020",
    animal: "Dog",
    count: 4,
    condition: "Abandoned",
    emergency: "MEDIUM",
    status: "ACCEPTED",
    title: "Four puppies abandoned in a box",
    description:
      "Four newborn puppies left in a cardboard box near a shop shutter in Manish Nagar. No mother dog around and rain is expected tonight.",
    area: "Manish Nagar",
    address: "Lane 3, Manish Nagar, Nagpur 440037",
    coords: [21.0876, 79.0688],
    distanceKm: 3.4,
    reporter: ["U-005", "Tejas Ingle", "+91 87660 90014"],
    rescuer: ["U-104", "Sneha Bhatt"],
    ngo: ["NGO-03", "Karuna Animal Shelter"],
    hoursAgo: 8,
  },
  {
    id: "R1019",
    animal: "Bird",
    count: 1,
    condition: "Injured",
    emergency: "HIGH",
    status: "RESCUED",
    title: "Pigeon injured by kite string",
    description:
      "Pigeon caught in manja near a terrace in Sitabuldi. The wing is cut and the bird is hanging from an electric wire.",
    area: "Sitabuldi",
    address: "Main Road, Sitabuldi, Nagpur 440012",
    coords: [21.1462, 79.0805],
    distanceKm: 1.9,
    reporter: ["U-002", "Ananya Joshi", "+91 90967 21188"],
    rescuer: ["U-110", "Sanjay Rathod"],
    ngo: ["NGO-05", "Vidarbha Wildlife Care"],
    hoursAgo: 26,
    durationMins: 74,
  },
  {
    id: "R1018",
    animal: "Dog",
    count: 1,
    condition: "Sick",
    emergency: "MEDIUM",
    status: "CLOSED",
    title: "Dog with severe skin infection",
    description:
      "A stray dog near the Bajaj Nagar garden has heavy mange and open wounds on the back. It is eating but very weak.",
    area: "Bajaj Nagar",
    address: "Bajaj Nagar Garden Gate, Nagpur 440010",
    coords: [21.1229, 79.0453],
    distanceKm: 5.6,
    reporter: ["U-001", "Rahul Verma", "+91 98812 33440"],
    rescuer: ["U-102", "Priya Patil"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 52,
    durationMins: 128,
  },
  {
    id: "R1017",
    animal: "Cat",
    count: 2,
    condition: "Abandoned",
    emergency: "LOW",
    status: "CLOSED",
    title: "Two kittens left near society gate",
    description:
      "Two kittens about a month old were left near the society gate in Manish Nagar. They are healthy but need shelter and feeding.",
    area: "Manish Nagar",
    address: "Sun Residency Gate, Manish Nagar, Nagpur 440037",
    coords: [21.0791, 79.0602],
    distanceKm: 3.9,
    reporter: ["U-003", "Kunal Bhosale", "+91 91720 55613"],
    rescuer: ["U-109", "Ritu Chandak"],
    ngo: ["NGO-03", "Karuna Animal Shelter"],
    hoursAgo: 74,
    durationMins: 96,
  },
  {
    id: "R1016",
    animal: "Dog",
    count: 1,
    condition: "Accident",
    emergency: "CRITICAL",
    status: "CLOSED",
    title: "Dog hit near Sadar flyover",
    description:
      "Adult dog hit by a car under the Sadar flyover. Unable to move the front legs and bleeding from the mouth.",
    area: "Sadar",
    address: "Under Sadar Flyover, Nagpur 440001",
    coords: [21.1601, 79.0821],
    distanceKm: 2.3,
    reporter: ["U-004", "Fatima Ansari", "+91 98501 77320"],
    rescuer: ["U-105", "Amit Deshpande"],
    ngo: ["NGO-02", "Nagpur Animal Aid Trust"],
    hoursAgo: 98,
    durationMins: 61,
  },
  {
    id: "R1015",
    animal: "Cow",
    count: 1,
    condition: "Sick",
    emergency: "HIGH",
    status: "CLOSED",
    title: "Cow unable to stand near Sitabuldi market",
    description:
      "A cow has been sitting at the same spot for two days near the Sitabuldi vegetable market. It refuses food and looks dehydrated.",
    area: "Sitabuldi",
    address: "Vegetable Market Road, Sitabuldi, Nagpur 440012",
    coords: [21.1489, 79.0762],
    distanceKm: 2.1,
    reporter: ["U-005", "Tejas Ingle", "+91 87660 90014"],
    rescuer: ["U-105", "Amit Deshpande"],
    ngo: ["NGO-02", "Nagpur Animal Aid Trust"],
    hoursAgo: 120,
    durationMins: 185,
  },
  {
    id: "R1014",
    animal: "Dog",
    count: 1,
    condition: "Trapped",
    emergency: "MEDIUM",
    status: "CLOSED",
    title: "Dog stuck between compound walls",
    description:
      "A young dog slipped into the narrow gap between two compound walls in Bajaj Nagar and cannot turn around.",
    area: "Bajaj Nagar",
    address: "Plot 44, Bajaj Nagar, Nagpur 440010",
    coords: [21.1198, 79.0498],
    distanceKm: 5.1,
    reporter: ["U-001", "Rahul Verma", "+91 98812 33440"],
    rescuer: ["U-102", "Priya Patil"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 148,
    durationMins: 52,
  },
  {
    id: "R1013",
    animal: "Bird",
    count: 3,
    condition: "Injured",
    emergency: "MEDIUM",
    status: "CLOSED",
    title: "Three parakeets injured after tree fall",
    description:
      "A branch fell during the storm near Dharampeth and three parakeet chicks were found on the ground with injuries.",
    area: "Dharampeth",
    address: "West High Court Road, Dharampeth, Nagpur 440010",
    coords: [21.1372, 79.0664],
    distanceKm: 1.4,
    reporter: ["U-002", "Ananya Joshi", "+91 90967 21188"],
    rescuer: ["U-110", "Sanjay Rathod"],
    ngo: ["NGO-05", "Vidarbha Wildlife Care"],
    hoursAgo: 170,
    durationMins: 88,
  },
  {
    id: "R1012",
    animal: "Dog",
    count: 1,
    condition: "Injured",
    emergency: "HIGH",
    status: "CLOSED",
    title: "Dog with fractured leg near Hingna Road",
    description:
      "Stray dog limping with a visibly fractured front leg near the Hingna Road industrial gate. It is aggressive due to pain.",
    area: "Hingna Road",
    address: "MIDC Gate 2, Hingna Road, Nagpur 440016",
    coords: [21.1141, 78.9987],
    distanceKm: 7.2,
    reporter: ["U-003", "Kunal Bhosale", "+91 91720 55613"],
    rescuer: ["U-107", "Vikas Meshram"],
    ngo: ["NGO-04", "Street Guardians Foundation"],
    hoursAgo: 196,
    durationMins: 143,
  },
  {
    id: "R1011",
    animal: "Cat",
    count: 1,
    condition: "Trapped",
    emergency: "LOW",
    status: "CLOSED",
    title: "Cat stuck on a rooftop water tank",
    description:
      "A cat has been on top of a water tank for over a day in Sadar and is unable to climb down.",
    area: "Sadar",
    address: "Mount Road, Sadar, Nagpur 440001",
    coords: [21.1568, 79.0839],
    distanceKm: 2.5,
    reporter: ["U-004", "Fatima Ansari", "+91 98501 77320"],
    rescuer: ["U-102", "Priya Patil"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 220,
    durationMins: 47,
  },
  {
    id: "R1010",
    animal: "Dog",
    count: 2,
    condition: "Sick",
    emergency: "MEDIUM",
    status: "CLOSED",
    title: "Two dogs showing signs of distemper",
    description:
      "Two dogs near the Manish Nagar water tank are shivering and unable to walk straight. Possible distemper infection.",
    area: "Manish Nagar",
    address: "Water Tank Road, Manish Nagar, Nagpur 440037",
    coords: [21.0864, 79.0651],
    distanceKm: 3.6,
    reporter: ["U-005", "Tejas Ingle", "+91 87660 90014"],
    rescuer: ["U-109", "Ritu Chandak"],
    ngo: ["NGO-03", "Karuna Animal Shelter"],
    hoursAgo: 250,
    durationMins: 165,
  },
  {
    id: "R1009",
    animal: "Other",
    count: 1,
    condition: "Injured",
    emergency: "HIGH",
    status: "CLOSED",
    title: "Injured monkey near residential terrace",
    description:
      "A monkey with a wounded arm has been sitting on a terrace parapet in Wardha Road since morning and is not moving.",
    area: "Wardha Road",
    address: "Somalwada, Wardha Road, Nagpur 440025",
    coords: [21.1035, 79.0522],
    distanceKm: 4.4,
    reporter: ["U-001", "Rahul Verma", "+91 98812 33440"],
    rescuer: ["U-107", "Vikas Meshram"],
    ngo: ["NGO-04", "Street Guardians Foundation"],
    hoursAgo: 290,
    durationMins: 210,
  },
  {
    id: "R1008",
    animal: "Dog",
    count: 1,
    condition: "Abandoned",
    emergency: "LOW",
    status: "CANCELLED",
    title: "Pet dog reported as abandoned",
    description:
      "A dog was reported as abandoned near Dharampeth but the owner was traced by neighbours within the hour.",
    area: "Dharampeth",
    address: "Ram Nagar Square, Nagpur 440010",
    coords: [21.1341, 79.0611],
    distanceKm: 1.6,
    reporter: ["U-002", "Ananya Joshi", "+91 90967 21188"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 320,
  },
  {
    id: "R1007",
    animal: "Cow",
    count: 2,
    condition: "Other",
    emergency: "LOW",
    status: "CLOSED",
    title: "Cattle blocking traffic near Sitabuldi",
    description:
      "Two cows have settled in the middle of the road near Sitabuldi causing traffic jams during peak hours.",
    area: "Sitabuldi",
    address: "Zero Mile Square, Sitabuldi, Nagpur 440012",
    coords: [21.1495, 79.0819],
    distanceKm: 2.2,
    reporter: ["U-003", "Kunal Bhosale", "+91 91720 55613"],
    rescuer: ["U-105", "Amit Deshpande"],
    ngo: ["NGO-02", "Nagpur Animal Aid Trust"],
    hoursAgo: 360,
    durationMins: 70,
  },
  {
    id: "R1006",
    animal: "Dog",
    count: 1,
    condition: "Accident",
    emergency: "CRITICAL",
    status: "CLOSED",
    title: "Dog trapped under a parked truck",
    description:
      "A dog crawled under a parked truck near Hingna Road after an accident and is bleeding heavily.",
    area: "Hingna Road",
    address: "Transport Nagar, Hingna Road, Nagpur 440016",
    coords: [21.1109, 78.9931],
    distanceKm: 7.8,
    reporter: ["U-005", "Tejas Ingle", "+91 87660 90014"],
    rescuer: ["U-107", "Vikas Meshram"],
    ngo: ["NGO-04", "Street Guardians Foundation"],
    hoursAgo: 410,
    durationMins: 55,
  },
  {
    id: "R1005",
    animal: "Cat",
    count: 1,
    condition: "Sick",
    emergency: "MEDIUM",
    status: "CLOSED",
    title: "Cat with eye infection near Bajaj Nagar",
    description:
      "A stray cat with badly swollen eyes has been visiting a house in Bajaj Nagar for food and needs medical attention.",
    area: "Bajaj Nagar",
    address: "Lane 7, Bajaj Nagar, Nagpur 440010",
    coords: [21.1215, 79.0472],
    distanceKm: 5.3,
    reporter: ["U-004", "Fatima Ansari", "+91 98501 77320"],
    rescuer: ["U-102", "Priya Patil"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 460,
    durationMins: 92,
  },
  {
    id: "R1004",
    animal: "Dog",
    count: 1,
    condition: "Injured",
    emergency: "HIGH",
    status: "CLOSED",
    title: "Dog with deep wound on the neck",
    description:
      "A collar has cut into the neck of a street dog in Sadar. The wound is infected and needs immediate cleaning.",
    area: "Sadar",
    address: "Kingsway Road, Sadar, Nagpur 440001",
    coords: [21.1592, 79.0798],
    distanceKm: 2.4,
    reporter: ["U-001", "Rahul Verma", "+91 98812 33440"],
    rescuer: ["U-105", "Amit Deshpande"],
    ngo: ["NGO-02", "Nagpur Animal Aid Trust"],
    hoursAgo: 520,
    durationMins: 110,
  },
  {
    id: "R1003",
    animal: "Bird",
    count: 1,
    condition: "Trapped",
    emergency: "LOW",
    status: "CLOSED",
    title: "Owl trapped in a badminton net",
    description:
      "A barn owl got entangled in a badminton net at a Manish Nagar sports ground overnight.",
    area: "Manish Nagar",
    address: "Community Sports Ground, Manish Nagar, Nagpur 440037",
    coords: [21.0838, 79.0674],
    distanceKm: 3.7,
    reporter: ["U-002", "Ananya Joshi", "+91 90967 21188"],
    rescuer: ["U-110", "Sanjay Rathod"],
    ngo: ["NGO-05", "Vidarbha Wildlife Care"],
    hoursAgo: 580,
    durationMins: 40,
  },
  {
    id: "R1002",
    animal: "Dog",
    count: 1,
    condition: "Sick",
    emergency: "MEDIUM",
    status: "CLOSED",
    title: "Elderly dog unable to eat",
    description:
      "An old street dog in Dharampeth has stopped eating for three days and has visible mouth swelling.",
    area: "Dharampeth",
    address: "Lokmat Square, Nagpur 440010",
    coords: [21.1409, 79.0703],
    distanceKm: 1.1,
    reporter: ["U-003", "Kunal Bhosale", "+91 91720 55613"],
    rescuer: ["U-101", "Rahul Sharma"],
    ngo: ["NGO-01", "Helping Paws NGO"],
    hoursAgo: 640,
    durationMins: 78,
  },
  {
    id: "R1001",
    animal: "Cow",
    count: 1,
    condition: "Injured",
    emergency: "HIGH",
    status: "CLOSED",
    title: "Calf with injured hoof",
    description:
      "A calf near the Wardha Road cattle shed has a deep cut on its hoof and is limping badly.",
    area: "Wardha Road",
    address: "Besa Road Junction, Nagpur 440034",
    coords: [21.0994, 79.0567],
    distanceKm: 4.9,
    reporter: ["U-005", "Tejas Ingle", "+91 87660 90014"],
    rescuer: ["U-103", "Imran Sheikh"],
    ngo: ["NGO-04", "Street Guardians Foundation"],
    hoursAgo: 700,
    durationMins: 132,
  },
];

const NOW = new Date("2026-08-10T10:30:00+05:30").getTime();

const noteSets: Record<string, string[]> = {
  R1023: [
    "Reached the location, traffic police are helping to clear the lane.",
    "Dog sedated and stabilised. Moving to the Helping Paws clinic now.",
  ],
  R1022: ["Ambulance dispatched with a stretcher team of three volunteers."],
  R1019: ["Wing cleaned and splinted. Bird kept under observation for 10 days."],
};

// Mock evidence data for some closed cases
const evidenceData: Record<string, any> = {
  R1019: {
    status: "VERIFIED",
    photos: [imageForAnimal("Bird", 8)],
    notes: "Pigeon successfully rescued and treated. Wing fracture stabilized with splint. Bird released after recovery.",
    animalCondition: "Wing fracture, conscious, alert",
    treatmentNotes: "Cleaned wound, applied antiseptic, splinted wing. Pain management provided.",
    submittedAt: new Date(NOW - 26 * 3600 * 1000 + 5 * 22 * 60 * 1000).toISOString(),
    verifiedAt: new Date(NOW - 26 * 3600 * 1000 + 6 * 22 * 60 * 1000).toISOString(),
    submittedByName: "Sanjay Rathod",
    verifiedByName: "Dr. Priya Verma",
    submissionCount: 1,
    verificationNotes: "Evidence thoroughly reviewed and verified. Rescue completed successfully.",
    rejectionReason: "",
    events: [],
  },
  R1018: {
    status: "VERIFIED",
    photos: [imageForAnimal("Dog", 7)],
    notes: "Dog brought to clinic for treatment of severe mange. Treated with antibiotics and medicated baths. Currently in shelter care.",
    animalCondition: "Severe mange, open wounds on back, dehydrated",
    treatmentNotes: "Antibiotics (Amoxicillin), Medicated baths (3 times), Nutritional support, Tetanus injection.",
    submittedAt: new Date(NOW - 52 * 3600 * 1000 + 5 * 22 * 60 * 1000).toISOString(),
    verifiedAt: new Date(NOW - 52 * 3600 * 1000 + 6 * 22 * 60 * 1000).toISOString(),
    submittedByName: "Priya Patil",
    verifiedByName: "Dr. Amit Sharma",
    submissionCount: 1,
    verificationNotes: "Evidence verified. Dog is recovering well in our care.",
    rejectionReason: "",
    events: [],
  },
};

export const mockReports: RescueReport[] = seeds.map((s, i) => {
  const createdAt = new Date(NOW - s.hoursAgo * 3600 * 1000).toISOString();
  const evidence = evidenceData[s.id];
  const timeline = buildTimeline(s.status, createdAt, {
    reporter: s.reporter[1],
    ngo: s.ngo?.[1],
    rescuer: s.rescuer?.[1],
  }, evidence);
  const last = [...timeline].reverse().find((t) => t.at);
  return {
    id: s.id,
    animal: s.animal,
    count: s.count,
    condition: s.condition,
    emergency: s.emergency,
    status: s.status,
    title: s.title,
    description: s.description,
    images: [imageForAnimal(s.animal, i)],
    address: s.address,
    area: s.area,
    city: "Nagpur",
    coords: { lat: s.coords[0], lng: s.coords[1] },
    distanceKm: s.distanceKm,
    reporterId: s.reporter[0],
    reporterName: s.reporter[1],
    reporterPhone: s.reporter[2],
    rescuerId: s.rescuer?.[0],
    rescuerName: s.rescuer?.[1],
    ngoId: s.ngo?.[0],
    ngoName: s.ngo?.[1],
    createdAt,
    updatedAt: last?.at ?? createdAt,
    closedAt: s.status === "CLOSED" ? (last?.at ?? undefined) : undefined,
    durationMins: s.durationMins,
    timeline,
    notes: (noteSets[s.id] ?? []).map((text, n) => ({
      id: `${s.id}-N${n + 1}`,
      author: s.rescuer?.[1] ?? "Coordination desk",
      role: "rescuer" as const,
      at: new Date(new Date(createdAt).getTime() + (n + 2) * 20 * 60 * 1000).toISOString(),
      text,
    })),
    evidence: evidence ? {
      status: evidence.status,
      photos: [evidence.photos].flat(),
      notes: evidence.notes,
      animalCondition: evidence.animalCondition,
      treatmentNotes: evidence.treatmentNotes,
      completionCoords: undefined,
      submittedByName: evidence.submittedByName,
      submittedAt: evidence.submittedAt,
      submissionCount: evidence.submissionCount,
      verifiedByName: evidence.verifiedByName,
      verifiedAt: evidence.verifiedAt,
      verificationNotes: evidence.verificationNotes,
      rejectionReason: evidence.rejectionReason,
      events: evidence.events,
    } : undefined,
  };
});