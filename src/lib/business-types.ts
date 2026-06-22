export type BrandTone =
  | "friendly"
  | "premium"
  | "luxury"
  | "casual"
  | "modern"
  | "traditional"
  | "youth"
  | "family";

export const BRAND_TONES: { value: BrandTone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
  { value: "casual", label: "Casual" },
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "youth", label: "Youth" },
  { value: "family", label: "Family" },
];

export type BusinessTypePreset = {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
};

export const BUSINESS_TYPES: BusinessTypePreset[] = [
  { id: "ice_cream", label: "Ice Cream Shop", emoji: "🍦", keywords: ["chocolate", "creamy", "brownie", "waffle cone", "sundae", "shake", "flavors", "scoop"] },
  { id: "cafe", label: "Cafe", emoji: "☕", keywords: ["coffee", "ambience", "cold coffee", "music", "pasta", "cozy", "wifi", "dessert"] },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️", keywords: ["food", "taste", "service", "ambience", "menu", "chef", "presentation"] },
  { id: "bakery", label: "Bakery", emoji: "🥐", keywords: ["fresh", "bread", "cake", "pastry", "soft", "aroma", "cookies"] },
  { id: "fast_food", label: "Fast Food", emoji: "🍔", keywords: ["quick", "burger", "fries", "tasty", "value", "hot", "crispy"] },
  { id: "hotel", label: "Hotel", emoji: "🏨", keywords: ["rooms", "staff", "comfort", "cleanliness", "view", "breakfast", "service"] },
  { id: "salon", label: "Salon", emoji: "💇", keywords: ["haircut", "styling", "grooming", "cleanliness", "stylist", "experience"] },
  { id: "spa", label: "Spa", emoji: "💆", keywords: ["relaxing", "massage", "ambience", "therapist", "calming", "hygiene"] },
  { id: "gym", label: "Gym", emoji: "🏋️", keywords: ["trainer", "workout", "fitness", "equipment", "motivation", "facilities"] },
  { id: "clothing", label: "Clothing Store", emoji: "👕", keywords: ["collection", "fit", "fabric", "style", "trendy", "variety", "staff"] },
  { id: "electronics", label: "Electronics Shop", emoji: "🔌", keywords: ["genuine", "products", "warranty", "knowledgeable", "pricing", "service"] },
  { id: "medical", label: "Medical Store", emoji: "💊", keywords: ["medicines", "availability", "genuine", "prompt", "helpful staff"] },
  { id: "grocery", label: "Grocery Store", emoji: "🛒", keywords: ["fresh", "variety", "pricing", "organized", "staff", "quality"] },
  { id: "car", label: "Car Showroom", emoji: "🚗", keywords: ["models", "test drive", "sales executive", "transparent", "delivery", "service"] },
  { id: "hospital", label: "Hospital", emoji: "🏥", keywords: ["doctors", "care", "cleanliness", "staff", "facilities", "treatment"] },
  { id: "dentist", label: "Dentist", emoji: "🦷", keywords: ["gentle", "painless", "treatment", "hygiene", "doctor", "experience"] },
  { id: "tattoo", label: "Tattoo Studio", emoji: "🎨", keywords: ["design", "artist", "hygiene", "detail", "creative", "experience"] },
  { id: "photography", label: "Photography Studio", emoji: "📸", keywords: ["photos", "creative", "editing", "props", "professional", "experience"] },
  { id: "pet", label: "Pet Shop", emoji: "🐾", keywords: ["pets", "accessories", "food", "care", "healthy", "staff"] },
  { id: "gaming", label: "Gaming Zone", emoji: "🎮", keywords: ["games", "setup", "vibe", "fps", "fun", "staff", "tournaments"] },
  { id: "other", label: "Other Business", emoji: "✨", keywords: ["service", "quality", "experience", "staff"] },
];

export function getBusinessTypePreset(id: string): BusinessTypePreset | undefined {
  return BUSINESS_TYPES.find((b) => b.id === id);
}

export function getBusinessTypeLabel(id: string, custom?: string | null): string {
  if (id === "other" && custom) return custom;
  return getBusinessTypePreset(id)?.label ?? "Business";
}
