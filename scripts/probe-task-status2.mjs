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

const res = await fetch(env.CONSOLIDATE_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": env.CONSOLIDATE_API_KEY,
  },
  body: JSON.stringify({
    query: `{ __type(name: "TaskStatus") { fields { name type { name kind ofType { name } } } } }`,
  }),
});
const j = await res.json();
console.log(j.data.__type.fields);

const sample = await fetch(env.CONSOLIDATE_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": env.CONSOLIDATE_API_KEY,
  },
  body: JSON.stringify({
    query: `{
      dataEntries_Task(take: 3) {
        items {
          values {
            status { name category }
            subject
          }
        }
      }
    }`,
  }),
});
console.log(JSON.stringify(await sample.json(), null, 2));
