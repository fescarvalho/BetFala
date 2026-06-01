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

// Sports keys to fetch: soccer leagues + NBA
const SPORT_KEYS = [
  'soccer_brazil_campeonato',     // Brasileirão Série A
  'soccer_brazil_campeonato_b',   // Brasileirão Série B
  'soccer_uefa_champs_league',    // Champions League
  'soccer_epl',                   // Premier League
  'soccer_brazil_copa',           // Copa do Brasil
  'basketball_nba',               // NBA
];

export async function fetchUpcomingOdds(): Promise<OddsGame[]> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not defined in environment variables.');
  }

  // Fetch all sports in parallel, ignoring individual failures (sport may be off-season)
  const results = await Promise.allSettled(
    SPORT_KEYS.map((sportKey) => {
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=eu,uk&markets=h2h,spreads&oddsFormat=decimal&apiKey=${apiKey}&dateFormat=iso`;
      return fetch(url, { next: { revalidate: 3600 } }).then((r) =>
        r.ok ? (r.json() as Promise<OddsGame[]>) : []
      );
    })
  );

  const allGames: OddsGame[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allGames.push(...result.value);
    }
  }

  // Sort by commence_time (soonest first) and limit to avoid token overflow
  allGames.sort((a, b) =>
    new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
  );

  return allGames.slice(0, 15);
}
