/** The four freeform "run this creature quickly" fields, shared by every place that adds or edits a monster/NPC. */
export default function CombatStatsFields({
  attacks,
  setAttacks,
  toHit,
  setToHit,
  damage,
  setDamage,
  abilities,
  setAbilities,
}: {
  attacks: string;
  setAttacks: (v: string) => void;
  toHit: string;
  setToHit: (v: string) => void;
  damage: string;
  setDamage: (v: string) => void;
  abilities: string;
  setAbilities: (v: string) => void;
}) {
  return (
    <div className="combat-stats-fields">
      <div className="row wrap">
        <input
          type="number"
          placeholder="Attacks"
          className="attacks-input"
          title="Number of attacks per turn"
          value={attacks}
          onChange={(e) => setAttacks(e.target.value)}
        />
        <input
          type="text"
          placeholder="To hit (e.g. +5)"
          value={toHit}
          onChange={(e) => setToHit(e.target.value)}
        />
        <input
          type="text"
          placeholder="Damage (e.g. 1d8+3 slashing)"
          value={damage}
          onChange={(e) => setDamage(e.target.value)}
        />
      </div>
      <textarea
        placeholder="Special abilities…"
        rows={2}
        value={abilities}
        onChange={(e) => setAbilities(e.target.value)}
      />
    </div>
  );
}
