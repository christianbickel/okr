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

async function gql(query, variables, { headers = {}, cookieJar } = {}) {
  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (cookieJar?.length) {
    reqHeaders.Cookie = cookieJar.map((c) => c.split(";")[0]).join("; ");
  }
  const res = await fetch(env.CONSOLIDATE_API_URL, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({ query, variables }),
  });
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  if (cookieJar && setCookie.length) cookieJar.push(...setCookie);
  return {
    status: res.status,
    setCookie,
    allHeaders: [...res.headers.entries()],
    json: await res.json(),
  };
}

const jar = [];
const auth = await gql(
  `mutation($input: AuthenticateInput!) {
    authenticate(input: $input) {
      signInResult {
        succeeded
        requiresTwoFactor
        isLockedOut
        requiresPasswordChange
      }
    }
  }`,
  { input: { username: "christian@kassello.com", password: "definitely-wrong" } },
  { cookieJar: jar }
);
console.log("auth wrong", JSON.stringify(auth, null, 2));
console.log("jar", jar);

// Does me work with only cookies after failed auth? expect no
const me1 = await gql(`{ me { id user { email } } }`, undefined, { cookieJar: jar });
console.log("me after fail", JSON.stringify(me1.json, null, 2));

// me with API key
const me2 = await gql(`{ me { id user { email } } }`, undefined, {
  headers: { "X-API-Key": env.CONSOLIDATE_API_KEY },
});
console.log("me with key", JSON.stringify(me2.json, null, 2));

// Can we authenticate WITHOUT api key at all?
const auth2 = await gql(
  `mutation($input: AuthenticateInput!) {
    authenticate(input: $input) {
      signInResult { succeeded requiresTwoFactor isLockedOut requiresPasswordChange }
    }
  }`,
  { input: { username: "x", password: "y" } }
);
console.log("auth no key", JSON.stringify(auth2, null, 2));
