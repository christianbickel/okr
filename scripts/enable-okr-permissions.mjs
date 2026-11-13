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
  "UpdateServiceUserInput",
  "CreateServiceUserInput",
  "PermissionInput",
  "UpdateUserInput",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      inputFields { name type { kind name ofType { kind name ofType { name } } } }
    }
  }`);
  console.log(name, JSON.stringify(t.data?.__type, null, 2));
}

const me = await gql(`{ me { id user { id displayName } } }`);
console.log("me", me.data.me);

// Inspect updateServiceUser mutation return
const mut = await gql(`{
  __type(name: "Mutation") {
    fields {
      name
      args { name type { kind name ofType { name } } }
    }
  }
}`);
console.log(
  "updateServiceUser",
  JSON.stringify(
    mut.data.__type.fields.find((f) => f.name === "updateServiceUser"),
    null,
    2
  )
);
console.log(
  "updateUser",
  JSON.stringify(
    mut.data.__type.fields.find((f) => f.name === "updateUser"),
    null,
    2
  )
);
