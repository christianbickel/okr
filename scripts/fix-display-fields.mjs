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

/** ComboBox/RichText/etc. are NOT valid display fields in Consolidate. */
const DISPLAY_FIELDS = {
  OkrCycle: ["title", "startDate", "endDate"],
  OkrObjective: ["title", "progress"],
  OkrKeyResult: ["title", "currentValue"],
  OkrCheckIn: ["title", "value", "checkInDate"],
};

function existingToInput(field) {
  if (field.__typename === "ValueFieldDefinition") {
    const value = {
      key: field.key,
      label: field.label,
      required: field.required,
      valueType: field.valueType,
      selectionType: field.selectionType,
      searchable: field.searchable,
      archived: field.archived,
      validators: [],
      security: [],
      allowedValues: [],
      requiresManagePermissions: field.requiresManagePermissions,
      section: field.section,
      size: field.size,
    };
    if (field.dataCollection) value.dataCollection = field.dataCollection;
    if (field.helpText) value.helpText = field.helpText;
    if (field.fieldGroup) value.fieldGroup = field.fieldGroup;
    if (field.maxDecimals != null) value.maxDecimals = field.maxDecimals;
    if (field.comboBoxOptions?.length) {
      value.comboBoxOptions = field.comboBoxOptions.map((o) => o.value);
    }
    return { value };
  }
  if (field.__typename === "GroupFieldDefinition") {
    return {
      group: {
        key: field.key,
        label: field.label,
        section: field.section,
        size: field.size,
        ...(field.fieldGroup ? { fieldGroup: field.fieldGroup } : {}),
      },
    };
  }
  // Drop placeholders
  if (
    field.__typename === "DisplayFieldDefinition" &&
    (field.key === "___placeholder" || field.displayType === "Placeholder")
  ) {
    return null;
  }
  return {
    display: {
      key: field.key,
      label: field.label,
      displayType: field.displayType,
      section: field.section,
      size: field.size,
      ...(field.fieldGroup ? { fieldGroup: field.fieldGroup } : {}),
    },
  };
}

for (const [dc, displayFields] of Object.entries(DISPLAY_FIELDS)) {
  const formJson = await gql(
    `query($dc: DataCollection!) {
      dataForm(dataCollection: $dc) {
        id displayName icon color
        allowMultipleTypes allowCommenting allowInactive allowAttachments
        displayFields
        fields {
          __typename
          ... on ValueFieldDefinition {
            key label required valueType selectionType dataCollection searchable archived
            comboBoxOptions { value } maxDecimals requiresManagePermissions section fieldGroup size helpText
          }
          ... on GroupFieldDefinition { key label section fieldGroup size }
          ... on DisplayFieldDefinition { key label displayType section fieldGroup size }
        }
      }
    }`,
    { dc }
  );

  const form = formJson.data?.dataForm;
  if (!form) {
    console.log(dc, "MISSING", formJson);
    continue;
  }

  const fields = form.fields.map(existingToInput).filter(Boolean);

  const update = await gql(
    `mutation($input: UpdateDataFormInput!) {
      updateDataForm(input: $input) {
        dataForm { id displayName displayFields }
        errors { __typename ... on Error { message } }
      }
    }`,
    {
      input: {
        id: form.id,
        displayName: form.displayName,
        color: form.color,
        icon: form.icon || "Folder",
        allowMultipleTypes: form.allowMultipleTypes,
        allowCommenting: form.allowCommenting,
        allowInactive: form.allowInactive,
        allowAttachments: form.allowAttachments,
        displayFields,
        fields,
      },
    }
  );

  console.log(
    dc,
    "old=",
    form.displayFields,
    "->",
    displayFields,
    JSON.stringify(update.errors || update.data?.updateDataForm)
  );
}

// Retry create
const create = await gql(
  `mutation($input: CreateOkrCycleInput!) {
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
  }`,
  {
    input: {
      dataEntry: {
        title: "Q4 2026",
        description: { htmlText: "<p>adsf</p>" },
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        cycleType: 0,
        status: 1,
      },
      securityRules: [
        {
          key: { roleId: "Um9sZTpyb2xlcy9BZG1pbmlzdHJhdG9y" },
          value: "Manage",
        },
      ],
    },
  }
);
console.log("\ncreate after fix:", JSON.stringify(create, null, 2));
