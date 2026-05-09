export type PerlerColor =
  | "white"
  | "black"
  | "lightGrey"
  | "grey"
  | "darkGrey"
  | "red"
  | "darkRed"
  | "pink"
  | "lightPink"
  | "hotCoral"
  | "magenta"
  | "peach"
  | "salmon"
  | "orange"
  | "lightOrange"
  | "pumpkin"
  | "brown"
  | "darkBrown"
  | "lightBrown"
  | "tan"
  | "cheddar"
  | "yellow"
  | "pastelYellow"
  | "cream"
  | "lightGreen"
  | "green"
  | "darkGreen"
  | "kiwiLime"
  | "mint"
  | "pastelGreen"
  | "huntingGreen"
  | "lightBlue"
  | "blue"
  | "darkBlue"
  | "cobalt"
  | "navy"
  | "skyBlue"
  | "periwinkle"
  | "pastelBlue"
  | "purple"
  | "plum"
  | "lavender"
  | "lightLavender"
  | "pastelLavender"
  | "beige"
  | "gold"
  | "silver";

export const PERLER_HEX: Record<PerlerColor, string> = {
  white: "#FFFFFF",
  black: "#1B1B1B",

  lightGrey: "#C7C7C7",
  grey: "#888888",
  darkGrey: "#4F4F4F",

  red: "#D9343A",
  darkRed: "#A12028",

  pink: "#F4A6C0",
  lightPink: "#FBD3DE",
  hotCoral: "#FF8C8E",
  magenta: "#D24594",

  peach: "#FFCFAB",
  salmon: "#FB9580",

  orange: "#F38B3C",
  lightOrange: "#FBB76C",
  pumpkin: "#E76A20",

  brown: "#7C5037",
  darkBrown: "#4A2F1F",
  lightBrown: "#A0734A",
  tan: "#D4A875",
  cheddar: "#E89D2C",

  yellow: "#F7D440",
  pastelYellow: "#F8E89E",
  cream: "#F4ECC8",

  lightGreen: "#A1D88B",
  green: "#5BB04A",
  darkGreen: "#2F7B3A",
  kiwiLime: "#C4DA45",
  mint: "#A8E0C7",
  pastelGreen: "#C9E4B5",
  huntingGreen: "#1F5C2D",

  lightBlue: "#7FBEEB",
  blue: "#3A87C9",
  darkBlue: "#1E5A95",
  cobalt: "#2C5DBA",
  navy: "#1B2E55",
  skyBlue: "#9FD8E8",
  periwinkle: "#7B89C5",
  pastelBlue: "#BAD1EC",

  purple: "#7044A2",
  plum: "#4F2A66",
  lavender: "#A593C9",
  lightLavender: "#C3B5DB",
  pastelLavender: "#D8CDE6",

  beige: "#E8DDC1",
  gold: "#D2A03A",
  silver: "#BFC2C7",
};

export const PERLER_NAME: Record<PerlerColor, string> = {
  white: "White",
  black: "Black",
  lightGrey: "Light Grey",
  grey: "Grey",
  darkGrey: "Dark Grey",
  red: "Red",
  darkRed: "Dark Red",
  pink: "Pink",
  lightPink: "Light Pink",
  hotCoral: "Hot Coral",
  magenta: "Magenta",
  peach: "Peach",
  salmon: "Salmon",
  orange: "Orange",
  lightOrange: "Light Orange",
  pumpkin: "Pumpkin",
  brown: "Brown",
  darkBrown: "Dark Brown",
  lightBrown: "Light Brown",
  tan: "Tan",
  cheddar: "Cheddar",
  yellow: "Yellow",
  pastelYellow: "Pastel Yellow",
  cream: "Cream",
  lightGreen: "Light Green",
  green: "Green",
  darkGreen: "Dark Green",
  kiwiLime: "Kiwi Lime",
  mint: "Mint",
  pastelGreen: "Pastel Green",
  huntingGreen: "Hunter Green",
  lightBlue: "Light Blue",
  blue: "Blue",
  darkBlue: "Dark Blue",
  cobalt: "Cobalt",
  navy: "Navy",
  skyBlue: "Sky Blue",
  periwinkle: "Periwinkle",
  pastelBlue: "Pastel Blue",
  purple: "Purple",
  plum: "Plum",
  lavender: "Lavender",
  lightLavender: "Light Lavender",
  pastelLavender: "Pastel Lavender",
  beige: "Beige",
  gold: "Gold",
  silver: "Silver",
};

export function perlerHex(color: PerlerColor): string {
  return PERLER_HEX[color];
}

export function perlerHexInt(color: PerlerColor): number {
  return parseInt(PERLER_HEX[color].slice(1), 16);
}
