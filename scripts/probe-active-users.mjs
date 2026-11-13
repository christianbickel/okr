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

for (const name of ["Query", "User"]) {
  // noop
}

const field = await gql(`{
  __type(name: "Query") {
    fields(includeDeprecated: true) {
      name
      args { name type { kind name ofType { kind name ofType { name } } } }
      type { kind name ofType { kind name ofType { name kind ofType { name } } } }
    }
  }
}`);

for (const n of ["activeUsers", "allUsers", "lastUsedUsers", "user", "invitableUsers"]) {
  const f = field.data.__type.fields.find((x) => x.name === n);
  console.log("\n===", n);
  console.log(JSON.stringify(f, null, 2));
}

for (const q of [
  `{ activeUsers { id displayName email } }`,
  `{ activeUsers { nodes { id displayName email } } }`,
  `{ activeUsers { items { id displayName email } } }`,
  `{ activeUsers(take: 20) { id displayName email } }`,
  `{ allUsers { id displayName email } }`,
  `{ lastUsedUsers { id displayName email } }`,
]) {
  const r = await gql(q);
  console.log("\nQ", q);
  console.log(JSON.stringify(r.errors?.[0]?.message ?? r.data, null, 2));
}
