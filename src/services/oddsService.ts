export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      last_update: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

export async function fetchUpcomingOdds(): Promise<OddsGame[]> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not defined in environment variables.');
  }

  // Fetching upcoming games with h2h (match winner) and spreads (handicap) markets
  const url = `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=us,eu,uk,au&markets=h2h,spreads&oddsFormat=decimal&apiKey=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

  if (!response.ok) {
    throw new Error(`Failed to fetch odds: ${response.status} ${response.statusText}`);
  }

  const data: OddsGame[] = await response.json();
  
  // Limiting the response to top 15 games to avoid token overflow in AI prompt
  return data.slice(0, 15);
}
