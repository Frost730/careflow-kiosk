import { Stethoscope, Heart, Bone, Sparkles, Child } from "../components/Icons";

export const API_BASE_URL = "http://127.0.0.1:8000";

export const DEPARTMENTS = [
  { name: "General Medicine", icon: Stethoscope, desc: "Primary care, wellness, & general check-ups" },
  { name: "Cardiology", icon: Heart, desc: "Heart health & cardiovascular treatments" },
  { name: "Orthopedics", icon: Bone, desc: "Bone, joint, & muscle care" },
  { name: "Dermatology", icon: Sparkles, desc: "Skin, hair, & nails treatment" },
  { name: "Pediatrics", icon: Child, desc: "Specialized care for infants & children" }
];

export const DOCTORS = {
  "General Medicine": [
    { name: "Dr. Alice Smith", spec: "MD, General Practice", room: "Room 101" },
    { name: "Dr. Bob Johnson", spec: "DO, Family Practice", room: "Room 102" }
  ],
  "Cardiology": [
    { name: "Dr. Clara Evans", spec: "MD, FACC, Cardiology", room: "Room 201" },
    { name: "Dr. David Miller", spec: "MD, Cardiovascular Science", room: "Room 202" }
  ],
  "Orthopedics": [
    { name: "Dr. Elena Rostova", spec: "MD, Joint & Bone Surgery", room: "Room 301" },
    { name: "Dr. Frank Wright", spec: "MD, Sports Medicine", room: "Room 302" }
  ],
  "Dermatology": [
    { name: "Dr. Grace Ho", spec: "MD, Dermatology & Skin Care", room: "Room 105" },
    { name: "Dr. Henry Vance", spec: "MD, Clinical Pathologist", room: "Room 106" }
  ],
  "Pediatrics": [
    { name: "Dr. Irene Adler", spec: "MD, General Pediatrics", room: "Room 108" },
    { name: "Dr. Jack Ryan", spec: "MD, Pediatric Cardiology", room: "Room 109" }
  ]
};
