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
  "IFilterableInput",
  "FilterGroupInput",
  "FieldFilterInput",
  "MetadataFilterInput",
  "FilterFieldIdentifierInput",
  "FieldFilterOperationInput",
  "FilterOperationInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name
      kind
      inputFields {
        name
        type { name kind ofType { name kind ofType { name } } }
      }
    }
  }`);
  console.log("\n====", name);
  console.log(JSON.stringify(t.data.__type, null, 2));
}
