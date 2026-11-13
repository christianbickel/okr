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

for (const dc of ["OkrCycle", "OkrObjective", "OkrKeyResult", "OkrCheckIn"]) {
  const json = await gql(
    `query($dc: DataCollection!) {
      dataForm(dataCollection: $dc) {
        displayName
        fields {
          __typename
          ... on ValueFieldDefinition { key valueType dataCollection required }
          ... on DisplayFieldDefinition { key displayType }
          ... on GroupFieldDefinition { key }
        }
      }
    }`,
    { dc }
  );
  console.log(
    "\n",
    dc,
    JSON.stringify(json.data?.dataForm?.fields ?? json, null, 2)
  );
}
