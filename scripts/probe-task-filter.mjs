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

const schema = await gql(`{
  __schema {
    types {
      name
      kind
      inputFields {
        name
        type { name kind ofType { name kind ofType { name } } }
      }
      fields {
        name
        args {
          name
          type { name kind ofType { name kind ofType { name } } }
        }
      }
    }
  }
}`);

const types = schema.data.__schema.types;
const filterTypes = types.filter((t) =>
  /Filter|Order|Task/.test(t.name || "")
);
console.log(
  "relevant",
  filterTypes.map((t) => `${t.kind} ${t.name}`).join("\n")
);

const taskQuery = types
  .find((t) => t.name === "Query")
  .fields.find((f) => f.name === "dataEntries_Task");
console.log("\ndataEntries_Task args", JSON.stringify(taskQuery.args, null, 2));

for (const name of [
  "TaskFilterInput",
  "DataEntries_TaskFilterInput",
  "TaskFilter",
  "ComparableInt32OperationFilterInput",
  "IFilterableInput",
]) {
  const t = types.find((x) => x.name === name);
  if (!t) {
    console.log(name, "missing");
    continue;
  }
  console.log("\n", name, t.kind);
  console.log(JSON.stringify(t.inputFields ?? t.fields, null, 2)?.slice(0, 2500));
}

// Try filter attachmentsCount
for (const filter of [
  { attachmentsCount: { gt: 0 } },
  { attachmentsCount: { neq: 0 } },
]) {
  const r = await gql(
    `query($filter: IFilterableInput, $take: Int!) {
      dataEntries_Task(filter: $filter, take: $take) {
        totalCount
        items { id attachmentsCount }
      }
    }`,
    { filter, take: 5 }
  );
  console.log("filter try", JSON.stringify(filter), r.errors?.[0]?.message || r.data);
}
