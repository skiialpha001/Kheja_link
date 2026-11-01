export type RentalAreaFaq = { question: string; answer: string };

export type MeruRentalArea = {
  slug: string;
  path: string;
  name: string;
  heading: string;
  locationSlugs: string[];
  description: string;
  localNote: string;
  officialContextLink?: { label: string; href: string };
  faqs: RentalAreaFaq[];
};

export const MERU_RENTAL_HUB = {
  path: "/houses-for-rent-meru",
  title: "Houses, Bedsitters and Apartments for Rent in Meru, Kenya",
  description:
    "Browse current long-term houses, bedsitters, single rooms, apartments and shops for rent across Meru County. Compare listing details and contact listers directly.",
};

export const MERU_RENTAL_AREAS: MeruRentalArea[] = [
  {
    slug: "kaaga-kithoka-meru",
    path: "/rentals/kaaga-kithoka-meru",
    name: "Kaaga and Kithoka",
    heading: "Houses and bedsitters for rent in Kaaga and Kithoka, Meru",
    locationSlugs: ["kaaga", "kithoka"],
    description:
      "Browse currently published rentals tagged in Kaaga and Kithoka. Compare the advertised rent, property type and features, then confirm availability and exact directions with the lister.",
    localNote:
      "KeMU identifies its main campus as Kaaga, off the Meru–Maua Highway. Listings on this page are matched to the location labels selected by their listers; confirm the route and distance directly before arranging a viewing.",
    officialContextLink: {
      label: "KeMU campus location",
      href: "https://kemu.ac.ke/contact",
    },
    faqs: [
      {
        question: "Are there rentals near Kenya Methodist University in Kaaga?",
        answer:
          "This page shows current listings tagged in Kaaga or Kithoka. KeMU lists its main campus in Kaaga, off the Meru–Maua Highway. Confirm the specific route and distance with the lister.",
      },
      {
        question: "How much does a rental in Kaaga or Kithoka cost?",
        answer:
          "Each available listing displays its advertised rent and payment period. Ask the lister to confirm the current amount, deposit and any other charges before paying.",
      },
      {
        question: "Can I confirm water, electricity or internet before viewing?",
        answer:
          "Yes. These details can vary by property, so ask the lister which utilities are available and how they are billed.",
      },
    ],
  },
  {
    slug: "makutano-gitoro-meru",
    path: "/rentals/makutano-gitoro-meru",
    name: "Makutano and Gitoro",
    heading: "Apartments and houses for rent in Makutano and Gitoro, Meru",
    locationSlugs: ["makutano", "gitoro"],
    description:
      "Explore current long-term rentals tagged in Makutano and Gitoro, Meru. Review the advertised rent, bedrooms, property type and amenities on each listing.",
    localNote:
      "This page groups listings whose saved location is Makutano or Gitoro. Exact directions and travel times depend on the property; confirm them with the lister before a visit.",
    faqs: [
      {
        question: "What rentals are available in Makutano and Gitoro?",
        answer:
          "The listings below are the currently published properties tagged in either area. Availability changes, so contact the lister to confirm that a property is still available.",
      },
      {
        question: "Are rent and deposit amounts shown?",
        answer:
          "The listing shows the advertised rent and the stated deposit terms when supplied. Confirm the full move-in cost with the lister before making a payment.",
      },
      {
        question: "How do I compare apartments in Makutano?",
        answer:
          "Compare the property type, bedroom count, listed rent, amenities and location shown on each listing, then ask the lister about any details you need verified.",
      },
    ],
  },
  {
    slug: "nchiru-meru",
    path: "/rentals/nchiru-meru",
    name: "Nchiru and the MUST area",
    heading: "Student rooms and rentals in Nchiru near MUST, Meru",
    locationSlugs: ["nchiru", "must-area"],
    description:
      "Browse current rentals tagged in Nchiru and the MUST area. Review the listing details and confirm availability, directions and all charges with the lister.",
    localNote:
      "MUST describes its main campus as near Nchiru Market, about 15 km from Meru Town along the Meru–Maua Road. Listing location labels are approximate area references, not a promise of walking distance to campus.",
    officialContextLink: {
      label: "MUST campus location",
      href: "https://www.must.ac.ke/location/",
    },
    faqs: [
      {
        question: "Are there rooms and bedsitters near MUST in Nchiru?",
        answer:
          "This page shows published listings tagged Nchiru or MUST area when available. Check each location label and confirm the actual route to campus with the lister.",
      },
      {
        question: "How far is a listed room from the MUST main campus?",
        answer:
          "The exact distance depends on the property. MUST places its main campus near Nchiru Market, around 15 km from Meru Town along Meru–Maua Road. Ask the lister for the property's directions.",
      },
      {
        question: "What should students confirm before paying?",
        answer:
          "Confirm availability, rent, deposit, utility costs, access arrangements and the viewing location directly with the lister. Do not pay before verifying the property and payment recipient.",
      },
    ],
  },
  {
    slug: "meru-town-cbd",
    path: "/rentals/meru-town-cbd",
    name: "Meru Town and Milimani",
    heading: "Houses and apartments for rent in Meru Town and Milimani",
    locationSlugs: ["meru-town", "milimani", "kinoru"],
    description:
      "Find current long-term rentals tagged in Meru Town, Milimani and Kinoru. Compare the published listing details and contact listers to confirm availability.",
    localNote:
      "Listings are grouped by the location labels in the KhejaLink directory. Check the individual listing for the named area and confirm its exact address and directions with the lister.",
    faqs: [
      {
        question: "Which Meru Town areas are covered on this page?",
        answer:
          "The page groups listings tagged Meru Town, Milimani or Kinoru. Each property card shows the location saved for that listing.",
      },
      {
        question: "How can I check the total cost of moving in?",
        answer:
          "Review the rent and deposit terms shown, then ask the lister to confirm any fees, utility charges or other costs before making a commitment.",
      },
      {
        question: "Can I visit before deciding?",
        answer:
          "Arrange a viewing with the lister and confirm the meeting point and property details. Verify the listing before sending money.",
      },
    ],
  },
  {
    slug: "nkubu-kaithe-meru",
    path: "/rentals/nkubu-kaithe-meru",
    name: "Nkubu and Kaithe",
    heading: "Houses and apartments for rent in Nkubu and Kaithe, Meru County",
    locationSlugs: ["nkubu", "kaithe"],
    description:
      "Browse current long-term rentals tagged in Nkubu and Kaithe. Check each published listing for its rent, property details and location, then confirm with the lister.",
    localNote:
      "This page groups listings carrying Nkubu or Kaithe location labels. Confirm the property's exact directions, transport options and availability directly with its lister.",
    faqs: [
      {
        question: "Are rentals available in Nkubu and Kaithe?",
        answer:
          "Current published listings appear below when available. The page does not display unpublished or unavailable properties; contact the lister to confirm current status.",
      },
      {
        question: "Where can I see the rent for a property?",
        answer:
          "The property card and detail page show the advertised price and period. Confirm the amount and deposit directly with the lister before paying.",
      },
      {
        question: "How do I confirm a property's location?",
        answer:
          "Use the public area label as a guide, then ask the lister for directions and arrange a viewing before making a payment.",
      },
    ],
  },
];

export function getMeruRentalArea(slug: string) {
  return MERU_RENTAL_AREAS.find((area) => area.slug === slug) ?? null;
}

export function getMeruAreaPathForLocation(locationSlug: string) {
  return MERU_RENTAL_AREAS.find((area) => area.locationSlugs.includes(locationSlug))?.path ?? null;
}
