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
  "Association",
  "FieldFilterOperationInput",
  "FilterFieldIdentifierInput",
  "FilterGroupInput",
  "FilterOperationInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      possibleTypes { name }
      fields { name type { kind name ofType { name kind ofType { name } } } }
      inputFields { name type { kind name ofType { name kind ofType { name } } } }
      enumValues { name }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type, null, 2));
}

const assoc = await gql(`{
  dataEntries_OkrObjective(take: 5) {
    items {
      id
      displayName
      associations {
        items {
          __typename
          id
          ... on Association {
            id
          }
        }
      }
    }
  }
}`);
console.log("\nassoc raw", JSON.stringify(assoc, null, 2));

// Association fields more carefully
const assocType = await gql(`{
  __type(name: "Association") {
    name kind
    fields { name description type { kind name ofType { name kind ofType { name } } } }
    interfaces { name }
  }
}`);
console.log("\nAssociation full", JSON.stringify(assocType, null, 2));
