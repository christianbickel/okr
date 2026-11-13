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

const me = await gql(`{
  me {
    id
    user { displayName email }
    possibleServiceUserPermissions { key value category }
  }
}`);
const perms = (me.data?.me?.possibleServiceUserPermissions ?? []).filter((p) =>
  /Project|DataEntries/i.test(p.key)
);
console.log("me", me.data?.me?.user);
console.log(
  "project-ish perms",
  perms.map((p) => `${p.key}=${p.value}`)
);

// Try associations from a known approach: search
const search = await gql(`{
  dataEntries(take: 5, searchString: "") {
    items { id __typename dataCollection displayName }
  }
}`);
console.log("dataEntries", JSON.stringify(search.errors ?? search.data, null, 2));

// Does OkrObjective have reverse field somehow after schema update?
const fields = await gql(`{
  __type(name: "OkrObjectiveFields") {
    fields { name type { kind name ofType { name kind ofType { name } } } }
  }
}`);
console.log(
  "objective fields",
  fields.data.__type.fields.map((f) => f.name)
);

// Try get projects via associations with include on project query through related
const one = await gql(`{
  dataEntry_OkrObjective(id: "RGF0YUVudHJ5Ok9CSi03") {
    id
    associations {
      items {
        entityId
        roles { __typename ... on EntryFieldAssociationRole { key dataCollection label } }
        entity { __typename id ... on Project { displayName values { name Ziele { id } } } }
      }
    }
  }
}`);
console.log("one", JSON.stringify(one, null, 2));
