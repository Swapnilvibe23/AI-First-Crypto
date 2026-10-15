import type { Config } from "@netlify/functions";
import { runMarketIngest } from "../../../api-server/src/lib/ingest";

// Fixed 15-minute schedule: CoinMarketCap credit use never depends on site traffic.
export default async () => {
  const summary = await runMarketIngest();
  console.log(JSON.stringify(summary));
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
