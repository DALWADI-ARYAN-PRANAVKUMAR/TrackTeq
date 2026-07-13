import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/india";

/**
 * Paired State / City selects. City list is derived from the caller's data
 * so it only lists cities that are actually present (and within the state
 * when a state is selected).
 */
export function StateCityFilter({
  state, city, onState, onCity, options,
}: {
  state: string;
  city: string;
  onState: (v: string) => void;
  onCity: (v: string) => void;
  /** Every row's state+city pair from the caller's dataset. */
  options: { state?: string | null; city?: string | null }[];
}) {
  const cities = useMemo(() => {
    const set = new Set<string>();
    options.forEach((o) => {
      if (!o.city) return;
      if (state !== "all" && o.state !== state) return;
      set.add(o.city);
    });
    return Array.from(set).sort();
  }, [options, state]);

  return (
    <div className="flex gap-2">
      <Select value={state} onValueChange={(v) => { onState(v); onCity("all"); }}>
        <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="State" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All states</SelectItem>
          {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={city} onValueChange={onCity} disabled={cities.length === 0}>
        <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="City" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All cities</SelectItem>
          {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
