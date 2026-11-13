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
  "ProjectFields",
  "OkrObjectiveFields",
  "DataEntry",
  "Project",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      fields { name type { kind name ofType { kind name ofType { name kind ofType { name } } } } }
    }
  }`);
  const fields = t.data?.__type?.fields ?? [];
  const hit = fields.filter((f) =>
    /ziel|goal|okr|object|project|link|ref|dataEntry/i.test(f.name)
  );
  console.log("\n===", name, "matched", hit.length, "/", fields.length);
  console.log(JSON.stringify(hit.length ? hit : fields.slice(0, 40), null, 2));
}

// Project form fields
const form = await gql(`{
  dataForm(dataCollection: "Project") {
    id
    displayName
    fields {
      key
      label
      valueType
      required
    }
  }
}`);
console.log("\n=== Project form fields");
console.log(
  JSON.stringify(
    form.data?.dataForm?.fields?.filter((f) =>
      /ziel|goal|okr|object/i.test(`${f.key} ${f.label}`)
    ) ?? form.errors,
    null,
    2
  )
);
console.log(
  "all keys",
  form.data?.dataForm?.fields?.map((f) => `${f.key}:${f.label}:${f.valueType}`)
);

// Sample projects with possible ziele fields
const projects = await gql(`{
  dataEntries_Project(take: 5) {
    items {
      id
      displayName
      values {
        __typename
      }
    }
  }
}`);
console.log("\n=== projects sample", JSON.stringify(projects, null, 2));

const projectFieldsType = await gql(`{
  __type(name: "ProjectFields") {
    fields { name type { kind name ofType { kind name ofType { name } } } }
  }
}`);
console.log(
  "\n=== ALL ProjectFields",
  projectFieldsType.data?.__type?.fields?.map((f) => f.name)
);
