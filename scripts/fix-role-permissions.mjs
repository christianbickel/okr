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

console.log(
  "UpdateRoleInput",
  JSON.stringify(
    await gql(`{
      __type(name: "UpdateRoleInput") {
        inputFields { name type { kind name ofType { kind name ofType { name } } } }
      }
    }`),
    null,
    2
  )
);

const role = await gql(
  `query($id: ID!) {
    node(id: $id) {
      ... on BasicRole {
        id
        name
        isSystemRole
        isDefault
        permissions { key value category }
      }
    }
  }`,
  { id: adminId }
);
console.log("admin role", JSON.stringify(role, null, 2));

const okrPerms = (role.data?.node?.permissions || []).filter((p) =>
  /Okr|DataEntries\./i.test(p.key)
);
console.log("okr-related admin perms", okrPerms);

// Try enabling service user OKR data entry perms
const me = await gql(`{ me { id } }`);
const allPossible = await gql(`{
  possibleServiceUserPermissions { key value category }
}`);
const permissions = (allPossible.data?.possibleServiceUserPermissions || []).map(
  (p) => ({
    key: p.key,
    value:
      p.key.startsWith("DataEntries.Okr") ||
      p.key === "DataForms" ||
      p.value === true
        ? true
        : p.value,
  })
);

console.log(
  "enabling",
  permissions.filter((p) => p.value).map((p) => p.key)
);

const updateSvc = await gql(
  `mutation($input: UpdateServiceUserInput!) {
    updateServiceUser(input: $input) {
      __typename
      ... on UpdateServiceUserPayload {
        user { id displayName }
      }
      ... on Error { message }
    }
  }`,
  {
    input: {
      id: me.data.me.id,
      name: "OKR",
      isActive: true,
      permissions,
    },
  }
);
console.log("updateServiceUser", JSON.stringify(updateSvc, null, 2));
