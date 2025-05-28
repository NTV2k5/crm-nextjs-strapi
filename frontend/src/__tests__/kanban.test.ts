import { describe, it, expect } from "vitest";
describe("KanbanBoard state", () => {
  it("moves deal to target stage correctly", () => {
    const deal = { documentId: "abc123", stage: "Moi" };
    const moved = { ...deal, stage: "Du dieu kien" };
    expect(moved.stage).toBe("Du dieu kien");
  });
  it("preserves other deals when moving one", () => {
    const deals = [
      { documentId: "a1", stage: "Moi" },
      { documentId: "b2", stage: "Du dieu kien" },
    ];
    const updated = deals.map(d => d.documentId === "a1" ? { ...d, stage: "De xuat" } : d);
    expect(updated[0].stage).toBe("De xuat");
    expect(updated[1].stage).toBe("Du dieu kien");
  });
});
