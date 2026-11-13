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

const roleType = await gql(`{
  __type(name: "IAssociationRole") {
    name kind
    possibleTypes { name }
    fields { name type { kind name ofType { name } } }
  }
}`);
console.log("IAssociationRole", JSON.stringify(roleType.data?.__type, null, 2));

const assoc = await gql(`{
  dataEntries_OkrObjective(take: 20) {
    items {
      id
      displayName
      associations {
        items {
          entityId
          roles { __typename ... on AssociationRole { name } }
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

const objId = "RGF0YUVudHJ5Ok9CSi05";
const filter = await gql(
  `query($filter: [IFilterableInput!], $take: Int!) {
    dataEntries_Project(filter: $filter, take: $take, includeInactive: false) {
      items { id displayName values { name Ziele { id displayName } } }
    }
  }`,
  {
    take: 10,
    filter: [
      {
        field: {
          field: { dataCollection: "Project", path: "Ziele", type: "Value" },
          operation: { in: [{ dataEntry: objId }] },
        },
      },
    ],
  }
);
console.log("\nfilter Value in dataEntry", JSON.stringify(filter, null, 2));

const filter2 = await gql(
  `query($filter: [IFilterableInput!], $take: Int!) {
    dataEntries_Project(filter: $filter, take: $take, includeInactive: false) {
      items { id displayName values { name Ziele { id displayName } } }
    }
  }`,
  {
    take: 10,
    filter: [
      {
        field: {
          field: { dataCollection: "Project", path: "Ziele", type: "Value" },
          operation: { eq: { dataEntry: objId } },
        },
      },
    ],
  }
);
console.log("\nfilter Value eq dataEntry", JSON.stringify(filter2, null, 2));
