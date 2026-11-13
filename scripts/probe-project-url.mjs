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

const projectType = await gql(`{
  __type(name: "Project") {
    fields { name type { kind name ofType { name } } }
  }
}`);
const urlish = projectType.data.__type.fields.filter((f) =>
  /url|link|path|slug|web|app|href/i.test(f.name)
);
console.log("project urlish", urlish);

const queryFields = await gql(`{ __type(name: "Query") { fields { name } } }`);
console.log(
  "query urlish",
  queryFields.data.__type.fields
    .map((f) => f.name)
    .filter((n) => /url|link|app|tenant|instance|portal/i.test(n))
);

// Try fetching one project with databaseId
const sample = await gql(`{
  dataEntries_Project(take: 1, includeInactive: false) {
    items { id displayName databaseId }
  }
}`);
console.log("sample", JSON.stringify(sample, null, 2));
