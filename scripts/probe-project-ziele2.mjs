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

for (const name of [
  "EntityAssociations",
  "OkrObjective",
  "DataEntriesProjectFilterInput",
  "ProjectFilterInput",
  "DataEntryFilterInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      fields { name type { kind name ofType { name kind ofType { name } } } }
      inputFields { name type { kind name ofType { name kind ofType { name } } } }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type ?? t.errors, null, 2));
}

const queryArgs = await gql(`{
  __type(name: "Query") {
    fields {
      name
      args { name type { kind name ofType { name kind ofType { name } } } }
    }
  }
}`);
const projectQuery = queryArgs.data.__type.fields.find(
  (f) => f.name === "dataEntries_Project"
);
console.log("\n=== dataEntries_Project args", JSON.stringify(projectQuery, null, 2));

// Try where/filter styles
for (const q of [
  `{ dataEntries_Project(take: 3, includeInactive: false) { items { id displayName values { Ziele { id displayName } name } } } }`,
  `{ dataEntries_OkrObjective(take: 3) { items { id displayName associations { __typename } } } }`,
]) {
  const r = await gql(q);
  console.log("\nQ", q.slice(0, 80));
  console.log(JSON.stringify(r.errors ?? r.data, null, 2));
}

const assoc = await gql(`{
  __type(name: "EntityAssociations") {
    fields { name type { kind name ofType { name kind ofType { name } } } }
  }
}`);
console.log("\nEntityAssociations fields", JSON.stringify(assoc.data?.__type, null, 2));
