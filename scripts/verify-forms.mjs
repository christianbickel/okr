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

await new Promise((r) => setTimeout(r, 2500));

const schema = await gql(`{ __schema { queryType { fields { name } } } }`);
console.log(
  "queries",
  schema.data.__schema.queryType.fields
    .map((f) => f.name)
    .filter((n) => /Okr/.test(n))
);

for (const dc of ["OkrCycle", "OkrObjective", "OkrKeyResult", "OkrCheckIn"]) {
  const j = await gql(
    `query($dc: DataCollection!) {
      dataForm(dataCollection: $dc) {
        fields {
          __typename
          ... on ValueFieldDefinition { key valueType }
          ... on DisplayFieldDefinition { key displayType }
        }
      }
    }`,
    { dc }
  );
  if (!j.data?.dataForm) {
    console.log(dc, "ERROR", JSON.stringify(j));
    continue;
  }
  const fields = j.data.dataForm.fields.map((f) =>
    f.valueType ? `${f.key}:${f.valueType}` : `${f.key}:${f.displayType}`
  );
  console.log(dc, fields.join(", "));
}
