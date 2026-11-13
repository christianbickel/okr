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

async function gql(query, variables, extraHeaders = {}) {
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.CONSOLIDATE_API_KEY,
      ...extraHeaders,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

const mut = await gql(`{ __type(name: "Mutation") { fields { name } } }`);
console.log(
  "mutations",
  mut.data.__type.fields
    .map((f) => f.name)
    .filter((n) =>
      /login|auth|sign|token|password|session|apiKey|credential|logout/i.test(n)
    )
);

const q = await gql(`{ __type(name: "Query") { fields { name } } }`);
console.log(
  "queries",
  q.data.__type.fields
    .map((f) => f.name)
    .filter((n) => /login|auth|sign|token|password|session|me/i.test(n))
);

for (const name of [
  "login",
  "authenticate",
  "createSession",
  "signIn",
  "obtainAccessToken",
  "createApiKey",
  "LoginInput",
  "AuthenticateInput",
  "LoginPayload",
]) {
  const t = await gql(`{
    __type(name: "${name}") {
      name kind
      inputFields { name type { kind name ofType { kind name ofType { name } } } }
      fields { name type { kind name ofType { name kind ofType { name } } } }
      enumValues { name }
    }
  }`);
  if (t.data?.__type) {
    console.log("\n===", name);
    console.log(JSON.stringify(t.data.__type, null, 2));
  }
}

const loginField = (
  await gql(`{
  __type(name: "Mutation") {
    fields {
      name
      args { name type { kind name ofType { kind name ofType { name } } } }
      type { kind name ofType { name kind ofType { name } } }
    }
  }
}`)
).data.__type.fields.find((f) => /login|auth|signIn|session/i.test(f.name));

console.log("\nlogin-ish field", JSON.stringify(loginField, null, 2));

const allLoginish = (
  await gql(`{
  __type(name: "Mutation") {
    fields {
      name
      args { name type { kind name ofType { kind name ofType { name } } } }
      type { kind name ofType { name kind ofType { name } } }
    }
  }
}`)
).data.__type.fields.filter((f) =>
  /login|auth|sign|token|password|session|credential/i.test(f.name)
);
console.log("\nall loginish details");
for (const f of allLoginish) console.log(JSON.stringify(f, null, 2));
