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

const adminId = "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y";

const payload = await gql(`{
  p: __type(name: "UpdateRolePayload") {
    fields { name type { kind name ofType { name } } }
  }
  e: __type(name: "UpdateRoleError") { kind possibleTypes { name } }
}`);
console.log(JSON.stringify(payload, null, 2));

// Minimal update attempt - only OKR perms + keep unknown?
const result = await gql(
  `mutation($input: UpdateRoleInput!) {
    updateRole(input: $input) {
      __typename
    }
  }`,
  {
    input: {
      id: adminId,
      name: "Administrator",
      isDefault: false,
      permissions: [
        { key: "DataEntries.OkrCycle", value: true },
        { key: "DataEntries.OkrObjective", value: true },
        { key: "DataEntries.OkrKeyResult", value: true },
        { key: "DataEntries.OkrCheckIn", value: true },
      ],
    },
  }
);
console.log("updateRole", JSON.stringify(result, null, 2));

const svc = await gql(
  `mutation($input: UpdateServiceUserInput!) {
    updateServiceUser(input: $input) { __typename }
  }`,
  {
    input: {
      id: (await gql(`{ me { id } }`)).data.me.id,
      name: "OKR",
      isActive: true,
      permissions: [
        { key: "DataEntries.OkrCycle", value: true },
        { key: "DataEntries.OkrObjective", value: true },
        { key: "DataEntries.OkrKeyResult", value: true },
        { key: "DataEntries.OkrCheckIn", value: true },
        { key: "DataForms", value: true },
      ],
    },
  }
);
console.log("updateServiceUser", JSON.stringify(svc, null, 2));
