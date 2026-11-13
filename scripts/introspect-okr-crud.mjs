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
  "OkrCycleInput",
  "UpdateOkrCycleInput",
  "CreateOkrCyclePayload",
  "UpdateOkrCyclePayload",
  "DataEntries_OkrCycleCollectionSegment",
  "OkrObjectiveInput",
  "UpdateOkrObjectiveInput",
  "OkrKeyResultInput",
  "UpdateOkrKeyResultInput",
  "OkrCheckInInput",
  "UpdateOkrCheckInInput",
  "MoveToTrashInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      inputFields { name type { kind name ofType { kind name ofType { name } } } }
      fields { name type { kind name ofType { name kind ofType { name } } } }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type, null, 2));
}

const q = await gql(`{
  __type(name: "Query") {
    fields {
      name
      args { name type { kind name ofType { name } } }
    }
  }
}`);
for (const f of q.data.__type.fields.filter((x) => /Okr/.test(x.name))) {
  console.log("query", f.name, JSON.stringify(f.args));
}
