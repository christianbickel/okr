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
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const json = await res.json();
  return { status: res.status, setCookie, json, headers: Object.fromEntries(res.headers) };
}

for (const name of [
  "AuthenticatePayload",
  "AuthenticateTwoFactorPayload",
  "AuthenticateTwoFactorInput",
  "SignOutInput",
  "CreateApiKeyInput",
  "CreateApiKeyPayload",
  "ApiKey",
]) {
  const r = await gql(
    `{
      __type(name: "${name}") {
        name kind
        possibleTypes { name }
        inputFields { name type { kind name ofType { kind name ofType { name } } } }
        fields { name type { kind name ofType { name kind ofType { name } } } }
        enumValues { name }
      }
    }`,
    undefined,
    { "X-API-Key": env.CONSOLIDATE_API_KEY }
  );
  console.log("\n===", name);
  console.log(JSON.stringify(r.json.data?.__type, null, 2));
}

// Try authenticate without API key (wrong password) to see error shape / cookies
const bad = await gql(
  `mutation($input: AuthenticateInput!) {
    authenticate(input: $input) {
      __typename
    }
  }`,
  { input: { username: "nobody@example.com", password: "wrong" } }
);
console.log("\nbad auth", JSON.stringify(bad, null, 2));
