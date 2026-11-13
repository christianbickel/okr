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

const ADMIN_ROLE_ID = "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y";

const me = await gql(`{ me { id user { id displayName email } } }`);
console.log("me", JSON.stringify(me.data?.me, null, 2));

const queryFields = await gql(`{
  __type(name: "Query") {
    fields { name }
  }
}`);
const names = queryFields.data.__type.fields
  .map((f) => f.name)
  .filter((n) => /user|person|member|assignee|account|principal/i.test(n));
console.log("query fields", names);

// find a real user from projects or any existing data
const probes = [
  `{ dataEntries_Project(take: 3) { items { id values { assignee { ... on User { id displayName email } } } } } }`,
  `{ dataEntries(take: 5) { items { id __typename } } }`,
  `{ searchUsers(search: "", take: 5) { items { id displayName email } } }`,
  `{ users(take: 5) { items { id displayName email } } }`,
  `{ allUsers(take: 5) { items { id displayName email } } }`,
];

for (const q of probes) {
  const r = await gql(q);
  console.log("\nPROBE", q.slice(0, 60));
  console.log(JSON.stringify(r.errors?.[0]?.message ?? r.data, null, 2));
}

const cycles = await gql(`{
  dataEntries_OkrCycle(take: 1) {
    items { id values { title } }
  }
}`);
const cycleId = cycles.data?.dataEntries_OkrCycle?.items?.[0]?.id;
console.log("\ncycleId", cycleId);

if (!cycleId) process.exit(0);

const meId = me.data.me.id;

const attempts = [
  {
    name: "owner=me + security admin+me",
    input: {
      dataEntry: {
        title: "Probe owner me",
        level: 0,
        cycleId,
        status: 0,
        owner: meId,
        progress: 0,
        weight: 1,
      },
      securityRules: [
        { key: { roleId: ADMIN_ROLE_ID }, value: "Manage" },
        { key: { userId: meId }, value: "Manage" },
      ],
    },
  },
  {
    name: "owner=me + security admin only",
    input: {
      dataEntry: {
        title: "Probe owner me adminsec",
        level: 0,
        cycleId,
        status: 0,
        owner: meId,
        progress: 0,
        weight: 1,
      },
      securityRules: [{ key: { roleId: ADMIN_ROLE_ID }, value: "Manage" }],
    },
  },
  {
    name: "no owner + security admin only",
    input: {
      dataEntry: {
        title: "Probe no owner",
        level: 0,
        cycleId,
        status: 0,
        progress: 0,
        weight: 1,
      },
      securityRules: [{ key: { roleId: ADMIN_ROLE_ID }, value: "Manage" }],
    },
  },
];

const mutation = `
  mutation($input: CreateOkrObjectiveInput!) {
    createOkrObjective(input: $input) {
      okrObjective { id values { title owner { ... on User { id displayName } } } }
    }
  }
`;

for (const a of attempts) {
  const r = await gql(mutation, { input: a.input });
  console.log("\n===", a.name);
  console.log(JSON.stringify(r.errors ?? r.data, null, 2));
}
