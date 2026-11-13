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

async function gql(query, variables, headers = {}) {
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });
  const setCookie = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [];
  return {
    status: res.status,
    setCookie,
    cookie: res.headers.get("set-cookie"),
    json: await res.json(),
  };
}

for (const name of [
  "SignInResult",
  "SuccessfulSignIn",
  "FailedSignIn",
  "TwoFactorRequired",
  "PasswordChangeRequired",
  "AuthenticationToken",
  "AccessToken",
]) {
  const r = await gql(
    `{
      __type(name: "${name}") {
        name kind
        possibleTypes { name }
        fields { name type { kind name ofType { name kind ofType { name } } } }
        enumValues { name }
        interfaces { name }
      }
    }`,
    undefined,
    { "X-API-Key": env.CONSOLIDATE_API_KEY }
  );
  console.log("\n===", name);
  console.log(JSON.stringify(r.json.data?.__type ?? r.json.errors, null, 2));
}

// Deep introspect SignInResult possible types
const signIn = await gql(
  `{
    __type(name: "SignInResult") {
      name kind
      possibleTypes { name }
    }
  }`,
  undefined,
  { "X-API-Key": env.CONSOLIDATE_API_KEY }
);
const types = signIn.json.data?.__type?.possibleTypes?.map((t) => t.name) ?? [];
for (const name of types) {
  const r = await gql(
    `{
      __type(name: "${name}") {
        name kind
        fields { name type { kind name ofType { name kind ofType { name } } } }
        interfaces { name }
      }
    }`,
    undefined,
    { "X-API-Key": env.CONSOLIDATE_API_KEY }
  );
  console.log("\n=== PT", name);
  console.log(JSON.stringify(r.json.data?.__type, null, 2));
}

const bad = await gql(
  `mutation($input: AuthenticateInput!) {
    authenticate(input: $input) {
      signInResult {
        __typename
        ... on FailedSignIn { message }
      }
    }
  }`,
  { input: { username: "nobody@example.com", password: "wrong" } }
);
console.log("\nbad detailed", JSON.stringify(bad, null, 2));
