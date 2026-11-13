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

for (const name of ["IAssociable", "FieldValueInput", "FilterFieldType", "AssociationRole"]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      possibleTypes { name }
      fields { name type { kind name ofType { name } } }
      inputFields { name type { kind name ofType { name kind ofType { name } } } }
      enumValues { name }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type, null, 2));
}

const assoc = await gql(`{
  dataEntries_OkrObjective(take: 10) {
    items {
      id
      displayName
      associations {
        items {
          entityId
          roles
          entity {
            __typename
            ... on Project {
              id
              displayName
              databaseId
              values { name }
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
  }
}`);
console.log("\nassoc", JSON.stringify(assoc, null, 2));

// Try filter projects by Ziele containing an objective id
const objs = await gql(`{ dataEntries_OkrObjective(take: 1) { items { id } } }`);
const objId = objs.data?.dataEntries_OkrObjective?.items?.[0]?.id;
console.log("\nobjId", objId);

if (objId) {
  const filterAttempts = [
    {
      name: "Ziele in eq id",
      filter: [
        {
          field: {
            field: { dataCollection: "Project", path: "Ziele", type: "Reference" },
            operation: { in: [{ id: objId }] },
          },
        },
      ],
    },
    {
      name: "Ziele contains",
      filter: [
        {
          field: {
            field: { dataCollection: "Project", path: "Ziele", type: "Text" },
            operation: { contains: objId },
          },
        },
      ],
    },
  ];

  // Probe FilterFieldType enum first was above
  for (const attempt of filterAttempts) {
    const r = await gql(
      `query($filter: [IFilterableInput!], $take: Int!) {
        dataEntries_Project(filter: $filter, take: $take, includeInactive: false) {
          items { id displayName values { name Ziele { id displayName } } }
        }
      }`,
      { filter: attempt.filter, take: 5 }
    );
    console.log("\nfilter", attempt.name, JSON.stringify(r.errors ?? r.data, null, 2));
  }
}
