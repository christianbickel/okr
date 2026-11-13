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

async function gql(query) {
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.CONSOLIDATE_API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

for (const name of ["TaskFields", "TaskStatus", "TaskStatusCategory"]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      fields { name type { name kind ofType { name kind ofType { name } } } }
      enumValues { name }
    }
  }`);
  const type = t.data.__type;
  console.log("\n====", name);
  if (type.enumValues) console.log(type.enumValues.map((e) => e.name));
  if (type.fields) {
    const statusish = type.fields.filter((f) =>
      /status|name|display|color|category|key/i.test(f.name)
    );
    console.log(
      statusish.map(
        (f) =>
          `${f.name}: ${f.type.name || f.type.ofType?.name || f.type.ofType?.ofType?.name}`
      )
    );
  }
}

const sample = await gql(`{
  dataEntries_Task(take: 3) {
    items {
      values {
        status { id name category color }
        subject
      }
    }
  }
}`);
console.log("\nsample", JSON.stringify(sample, null, 2));
