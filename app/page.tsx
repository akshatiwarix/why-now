import { Console } from "./components/Console";
import { COMPANIES, DEFAULT_AS_OF, OBSERVATIONS } from "@/data/corpus";
import { SELLERS } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";

/**
 * A server component whose only job is to hand the validated corpus to the
 * console. Zod runs here, at import time; the browser gets data that has
 * already passed it, and the engine that runs on both sides imports neither.
 */
export default function Home() {
  return (
    <Console
      data={{
        companies: COMPANIES,
        observations: OBSERVATIONS,
        sellers: SELLERS,
        warrants: WARRANTS,
        defaultAsOf: DEFAULT_AS_OF,
      }}
    />
  );
}
