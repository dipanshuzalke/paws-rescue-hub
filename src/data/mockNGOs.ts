import type { NGO } from "@/types";

export const mockNGOs: NGO[] = [
  {
    id: "NGO-01",
    name: "Helping Paws NGO",
    location: "Dharampeth, Nagpur",
    contactPerson: "Meera Deshmukh",
    email: "contact@helpingpaws.org",
    phone: "+91 98220 41255",
    rescuers: 14,
    cases: 312,
    verification: "VERIFIED",
    status: "ACTIVE",
    joinedAt: "2023-02-11",
    about:
      "Nagpur-based animal welfare organisation running a 24x7 ambulance service and a 40-bed shelter for injured strays.",
  },
  {
    id: "NGO-02",
    name: "Nagpur Animal Aid Trust",
    location: "Sadar, Nagpur",
    contactPerson: "Arjun Kale",
    email: "help@naat.org.in",
    phone: "+91 91456 77210",
    rescuers: 9,
    cases: 208,
    verification: "VERIFIED",
    status: "ACTIVE",
    joinedAt: "2022-08-04",
    about:
      "Trust focused on road-accident rescues, sterilisation drives and post-operative care for street dogs.",
  },
  {
    id: "NGO-03",
    name: "Karuna Animal Shelter",
    location: "Manish Nagar, Nagpur",
    contactPerson: "Sneha Bhatt",
    email: "info@karunashelter.in",
    phone: "+91 99700 31188",
    rescuers: 7,
    cases: 154,
    verification: "PENDING",
    status: "PENDING",
    joinedAt: "2025-11-19",
    about:
      "Community shelter offering foster placement for abandoned pups, kittens and injured cattle.",
  },
  {
    id: "NGO-04",
    name: "Street Guardians Foundation",
    location: "Wardha Road, Nagpur",
    contactPerson: "Imran Sheikh",
    email: "team@streetguardians.org",
    phone: "+91 93705 66421",
    rescuers: 11,
    cases: 265,
    verification: "VERIFIED",
    status: "ACTIVE",
    joinedAt: "2021-06-27",
    about:
      "Volunteer network covering the southern corridor of Nagpur with rapid-response two-wheeler rescue units.",
  },
  {
    id: "NGO-05",
    name: "Vidarbha Wildlife Care",
    location: "Sitabuldi, Nagpur",
    contactPerson: "Dr. Ketaki Rane",
    email: "care@vidarbhawildlife.org",
    phone: "+91 90280 14477",
    rescuers: 6,
    cases: 97,
    verification: "REJECTED",
    status: "INACTIVE",
    joinedAt: "2024-03-15",
    about:
      "Specialists in bird and small wildlife rescue, including kite-string injuries during Makar Sankranti.",
  },
];

export const ngoById = (id?: string) => mockNGOs.find((n) => n.id === id);