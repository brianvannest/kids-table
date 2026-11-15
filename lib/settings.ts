// The one settings file. To make the app your own, change the words and the lists below, and
// nothing else. The app's name, what a "restaurant" is called, and every list a person can
// choose from all come from here. Each choice has a key (stored in the database, never change
// it once you have data) and a label (what people see, change it any time).

export type Choice = { key: string; label: string };

export const settings = {
  appName: "The Kids' Table",
  tagline: "A small fry guide",

  // The words at the top of the public page.
  home: {
    heading: "Places to eat with kids",
    intro: "A short list of family-friendly spots our group likes. Search by name, or narrow it down.",
  },

  // What the app calls the things it keeps.
  item: { singular: "restaurant", plural: "restaurants" },
  visit: { singular: "visit", plural: "visits" },

  // The lists people choose from.
  areas: [
    { key: "heights", label: "The Heights" },
    { key: "katy", label: "Katy" },
    { key: "sugar-land", label: "Sugar Land" },
    { key: "other", label: "Somewhere else" },
  ],
  foodTypes: [
    { key: "pizza", label: "Pizza" },
    { key: "tacos", label: "Tacos" },
    { key: "american", label: "American" },
    { key: "burgers", label: "Burgers" },
    { key: "breakfast", label: "Breakfast" },
    { key: "bbq", label: "Barbecue" },
    { key: "asian", label: "Asian" },
    { key: "other", label: "Something else" },
  ],
  // Features are checkboxes. "Play area" is its own feature, not a kind of playground: the group
  // decided a sandbox isn't a playground (Chapter 8).
  features: [
    { key: "patio", label: "Patio" },
    { key: "playground", label: "Playground" },
    { key: "play-area", label: "Play area" },
  ],
} as const satisfies {
  appName: string;
  tagline: string;
  home: { heading: string; intro: string };
  item: { singular: string; plural: string };
  visit: { singular: string; plural: string };
  areas: readonly Choice[];
  foodTypes: readonly Choice[];
  features: readonly Choice[];
};

/** The label for a stored key, or the key itself if the list changed. */
export function labelFor(list: readonly Choice[], key: string | null | undefined): string {
  if (!key) return "";
  return list.find((c) => c.key === key)?.label ?? key;
}
