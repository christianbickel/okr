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
  return { status: res.status, json: await res.json() };
}

const schema = await gql(`{
  __schema {
    mutationType { fields { name } }
    queryType { fields { name } }
  }
}`);
const mut = schema.json.data.__schema.mutationType.fields
  .map((f) => f.name)
  .filter((n) => /Okr|DataEntry|create/i.test(n));
const qry = schema.json.data.__schema.queryType.fields
  .map((f) => f.name)
  .filter((n) => /Okr/i.test(n));
console.log("okr queries", qry);
console.log(
  "relevant mutations",
  mut.filter((n) => /Okr|createDataEntry/i.test(n))
);

for (const name of [
  "CreateOkrCycleInput",
  "OkrCycleInput",
  "OkrCycleFields",
  "CreateOkrCyclePayload",
  "RichTextInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      inputFields { name type { kind name ofType { kind name ofType { name } } } }
      fields { name type { kind name ofType { name kind ofType { name } } } }
      possibleTypes { name }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.json.data?.__type, null, 2));
}

// Form details incl. combo options
const form = await gql(`{
  dataForm(dataCollection: "OkrCycle") {
    id displayName idPrefix
    fields {
      __typename
      ... on ValueFieldDefinition {
        key label required valueType selectionType
        comboBoxOptions { id value }
        maxDecimals
      }
    }
  }
}`);
console.log("\n=== form");
console.log(JSON.stringify(form.json, null, 2));
