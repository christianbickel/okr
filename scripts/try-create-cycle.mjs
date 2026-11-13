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

const attempts = [
  {
    name: "combo-as-int",
    input: {
      dataEntry: {
        title: "Q4 2026 API",
        description: { htmlText: "<p>adsf</p>" },
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        cycleType: 0, // quarter
        status: 1, // active
      },
    },
  },
  {
    name: "minimal-ints",
    input: {
      dataEntry: {
        title: "Q4 2026 minimal",
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        cycleType: 0,
        status: 1,
      },
    },
  },
];

const mutation = `
  mutation CreateOkrCycle($input: CreateOkrCycleInput!) {
    createOkrCycle(input: $input) {
      okrCycle {
        id
        displayName
        values {
          title
          startDate
          endDate
          cycleType { id value }
          status { id value }
        }
      }
    }
  }
`;

for (const attempt of attempts) {
  const json = await gql(mutation, { input: attempt.input });
  console.log("\n===", attempt.name);
  console.log(JSON.stringify(json, null, 2));
  if (json.data?.createOkrCycle?.okrCycle?.id) break;
}

// list entries
console.log(
  "\n=== list",
  JSON.stringify(
    await gql(`{
      dataEntries_OkrCycle {
        items { id displayName values { title status { value } } }
      }
    }`),
    null,
    2
  )
);

// security template / form security
console.log(
  "\n=== form security",
  JSON.stringify(
    await gql(`{
      dataForm(dataCollection: "OkrCycle") {
        id
        securityTemplate { __typename }
      }
      me { id user { displayName email } }
    }`),
    null,
    2
  )
);
