import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  INTERIM_FIELDS,
  INTERIM_SLOTS,
  INVITE_FIELDS,
  LINE_FIELDS,
  SESSION_FIELDS,
} from "./liveSessionModel";

const rules = readFileSync(join(__dirname, "../../firestore.rules"), "utf8");

/** Field names inside every `hasOnly([...])` / sessionKeys list in the rules */
function listsInRules(): string[][] {
  const lists = [...rules.matchAll(/(?:hasOnly\(|return )\[([^\]]+)\]/g)].map((match) =>
    [...match[1].matchAll(/'([^']+)'/g)].map((field) => field[1])
  );
  return lists.map((fields) => [...fields].sort());
}

describe("firestore.rules field contract", () => {
  const lists = listsInRules();
  const sorted = (fields: readonly string[]) => [...fields].sort();

  it.each([
    ["sessions", SESSION_FIELDS],
    ["lines", LINE_FIELDS],
    ["interim", INTERIM_FIELDS],
    ["private/invites", INVITE_FIELDS],
  ])("rules accept exactly the %s fields the app writes", (_name, fields) => {
    expect(lists).toContainEqual(sorted(fields));
  });

  it("allows exactly the interim slots the app rotates through", () => {
    const slots = Array.from({ length: INTERIM_SLOTS }, (_, i) => `'${i}'`).join(", ");
    expect(rules).toContain(`slot in [${slots}]`);
  });
});
