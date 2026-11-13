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
  "OkrCycleUpdateInput",
  "OkrObjectiveUpdateInput",
  "OkrKeyResultUpdateInput",
  "OkrCheckInUpdateInput",
  "MoveToTrashPayload",
  "UserFieldValue",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name
      inputFields { name type { kind name ofType { name kind ofType { name } } } }
      fields { name type { name kind ofType { name } } }
    }
  }`);
  console.log("\n===", name);
  console.log(JSON.stringify(t.data?.__type, null, 2));
}

const list = await gql(`{
  dataEntries_OkrCycle(take: 5, includeInactive: false) {
    totalCount
    items {
      id
      displayName
      changeVector
      values {
        title
        startDate
        endDate
        cycleType { id value }
        status { id value }
        description { htmlText }
      }
    }
  }
  me { id }
}`);
console.log("\nlist", JSON.stringify(list, null, 2));
