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

const assocItems = await gql(`{
  dataEntries_OkrObjective(take: 5) {
    items {
      id
      displayName
      associations {
        items {
          __typename
          ... on Project {
            id
            displayName
            databaseId
            values { name Ziele { id displayName } }
          }
          ... on DataEntry {
            id
            displayName
            dataCollection
            databaseId
          }
        }
      }
    }
  }
}`);
console.log("assoc", JSON.stringify(assocItems, null, 2));

for (const name of [
  "IFilterableInput",
  "EqualsFilterInput",
  "ContainsFilterInput",
  "ReferenceFilterInput",
  "DataEntryReferenceFilterInput",
  "FieldFilterInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      possibleTypes { name }
      inputFields { name type { kind name ofType { name kind ofType { name } } } }
    }
  }`);
  if (t.data?.__type) {
    console.log("\n===", name);
    console.log(JSON.stringify(t.data.__type, null, 2));
  }
}

// list filter input types matching Filter
const types = await gql(`{
  __schema {
    types {
      name
      kind
    }
  }
}`);
const filterTypes = types.data.__schema.types
  .filter((t) => /filter/i.test(t.name) && t.kind === "INPUT_OBJECT")
  .map((t) => t.name);
console.log("\nfilter inputs", filterTypes);
