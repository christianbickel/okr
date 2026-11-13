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

for (const name of ["DeleteApiKeyInput", "EditApiKeyInput", "AuthenticateTwoFactorInput"]) {
  console.log(
    name,
    JSON.stringify(
      (
        await gql(`{ __type(name: "${name}") {
        inputFields { name type { kind name ofType { name kind ofType { name } } } }
      } }`)
      ).data?.__type,
      null,
      2
    )
  );
}
