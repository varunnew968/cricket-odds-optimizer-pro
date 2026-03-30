const API_KEY = '7e5907c8-12a3-4cbe-a9a0-7a7f3387776f';
const ENDPOINT = `https://api.cricapi.com/v1/matches?apikey=${API_KEY}`;

/**
 * Returns a fallback match if API fails or no IPL matches are found.
 */
function getFallbackMatches() {
  return [
    {
      team1: "CSK",
      team2: "RR",
      date: "today",
      status: "UPCOMING"
    }
  ];
}

/**
 * Node.js Match Module for IPL Live Data
 * Fetches, validates, filters, and formats match data safely.
 */
export async function getIPLMatches() {
  try {
    const response = await fetch(ENDPOINT);
    const data: any = await response.json();

    // STEP 2: VALIDATION
    if (data.status !== "success") {
      console.warn("MatchService: API returned failure status.");
      return getFallbackMatches();
    }

    const matches = (data.data || [])
      // STEP 3: FLEXIBLE IPL FILTER
      .filter((match: any) => match.series?.toLowerCase().includes("ipl"))
      // STEP 4 & 5: EXTRACT REQUIRED DATA & SAFE ACCESS
      .map((match: any) => ({
        team1: match.teamInfo?.[0]?.shortname || "TBD",
        team2: match.teamInfo?.[1]?.shortname || "TBD",
        date: match.date || "today",
        status: match.status || "UPCOMING"
      }));

    // STEP 7: FALLBACK SYSTEM
    if (matches.length === 0) {
      return getFallbackMatches();
    }

    return matches;
  } catch (error) {
    // STEP 6: ERROR HANDLING
    console.error("MatchService Error:", error);
    return getFallbackMatches();
  }
}
