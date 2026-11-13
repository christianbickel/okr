import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

async function gql(query, variables) {
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.CONSOLIDATE_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const ADMIN = "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y";
const users = await gql(
  `{ activeUsers(includeServiceUsers: false) { id displayName } }`
);
const owner =
  users.data.activeUsers.find((u) => u.displayName === "Christian Bickel") ||
  users.data.activeUsers[0];
const cycles = await gql(`{ dataEntries_OkrCycle(take:1){ items{ id } } }`);
const cycleId = cycles.data.dataEntries_OkrCycle.items[0].id;

const r = await gql(
  `mutation($input: CreateOkrObjectiveInput!) {
    createOkrObjective(input: $input) {
      okrObjective {
        id
        values {
          title
          owner { ... on User { id displayName } }
        }
      }
    }
  }`,
  {
    input: {
      dataEntry: {
        title: "Probe real owner",
        level: 0,
        cycleId,
        status: 0,
        owner: owner.id,
        progress: 0,
        weight: 1,
      },
      securityRules: [{ key: { roleId: ADMIN }, value: "Manage" }],
    },
  }
);
console.log(JSON.stringify(r, null, 2));
