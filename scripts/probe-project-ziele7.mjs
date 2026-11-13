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

for (const name of ["EntryFieldAssociationRole"]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      fields { name type { kind name ofType { name kind ofType { name } } } }
    }
  }`);
  console.log(name, JSON.stringify(t.data?.__type, null, 2));
}

const assoc = await gql(`{
  dataEntries_OkrObjective(take: 20) {
    items {
      id
      displayName
      associations {
        items {
          entityId
          roles {
            __typename
            ... on EntryFieldAssociationRole {
              fieldKey
              dataCollection
            }
          }
          entity {
            __typename
            ... on Project {
              id
              displayName
              databaseId
              values { name }
            }
          }
        }
      }
    }
  }
}`);
console.log("\nassoc", JSON.stringify(assoc, null, 2));
