/**
 * Community Chat Helper Configuration & Localization
 * Used to manage constants, titles, styling, and default greetings for the Orbi Business Community.
 */

export const COMMUNITY_CONVERSATION_ID = "orbi_business_community";

export interface CommunityParticipant {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export const COMMUNITY_PARTICIPANTS: CommunityParticipant[] = [
  {
    id: "orbi_business_community",
    name: "Orbi Business Community",
    role: "community",
    avatar: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=150"
  }
];

export const getCommunityMetadata = (lang: string = "sw") => {
  return {
    name: lang === "sw" ? "Jumuia ya Biashara Orbi" : "Orbi Business Community",
    description: lang === "sw" ? "Kundi la umma la wauzaji na wanunuzi" : "Public group for sellers and buyers",
    welcomeText: lang === "sw" 
      ? "Karibu kwenye Jumuia ya Orbi Business! Hapa unaweza kushiriki mawazo, kuuliza maswali, na kushirikiana na wanachama wote."
      : "Welcome to the Orbi Business Community! Here you can share thoughts, ask questions, and collaborate with all members.",
    membersCountLabel: lang === "sw" ? "Wanachama wote wa Orbi" : "All Orbi Members"
  };
};

/**
 * Returns custom styling classes for community chat tags/badges
 */
export const getCommunityTagStyles = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-slate-900 text-white border-slate-950";
    case "seller":
      return "bg-blue-50 text-blue-600 border-blue-100";
    case "customer":
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};
