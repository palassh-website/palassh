export interface PincodeZone {
  pincode: string;
  area: string;
  city: "Thane";
  deliverySlot: string;
}

// Strictly locked to 400601 through 400608 as requested
export const SERVICEABLE_PINCODES: Record<string, PincodeZone> = {
  "400601": {
    pincode: "400601",
    area: "Thane West (Gokhale Road / Station / Market)",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400602": {
    pincode: "400602",
    area: "Thane West (Naupada / Panchpakhadi)",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400603": {
    pincode: "400603",
    area: "Thane East (Kopri Colony)",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400604": {
    pincode: "400604",
    area: "Wagle Estate / Teen Hath Naka / Mulund Check Naka",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400605": {
    pincode: "400605",
    area: "Kalwa / Kharegaon (PALASSH Main Hub)",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400606": {
    pincode: "400606",
    area: "Vartak Nagar / Pokhran Road No. 1 & 2",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400607": {
    pincode: "400607",
    area: "Ghodbunder Road / Manpada / Chitalsar / Patlipada",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
  "400608": {
    pincode: "400608",
    area: "Balkum / Kolshet Road / Dhokali",
    city: "Thane",
    deliverySlot: "6:00 AM – 8:00 AM",
  },
};

export function checkPincodeAvailability(rawInput: string): {
  valid: boolean;
  serviceable: boolean;
  zone?: PincodeZone;
  message: string;
} {
  const cleaned = rawInput.trim().replace(/\D/g, "");

  if (cleaned.length !== 6) {
    return {
      valid: false,
      serviceable: false,
      message: "Please enter a valid 6-digit Thane pincode (400601 – 400608).",
    };
  }

  if (SERVICEABLE_PINCODES[cleaned]) {
    const zone = SERVICEABLE_PINCODES[cleaned];
    return {
      valid: true,
      serviceable: true,
      zone,
      message: `Available! We deliver farm-fresh puja flowers in ${zone.area} every morning between ${zone.deliverySlot}.`,
    };
  }

  return {
    valid: true,
    serviceable: false,
    message:
      "We currently serve only Thane pincodes 400601 to 400608. Expanding to your sector soon!",
  };
}
