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

function vf(def) {
  const v = {
    key: def.key,
    label: def.label,
    required: def.required,
    valueType: def.valueType,
    selectionType: "Single",
    searchable: true,
    archived: false,
    validators: [],
    security: [],
    allowedValues: [],
    requiresManagePermissions: false,
    section: def.section || "Main",
    size: def.size || "Full",
  };
  if (def.dataCollection) v.dataCollection = def.dataCollection;
  if (def.comboBoxOptions) v.comboBoxOptions = def.comboBoxOptions;
  if (def.maxDecimals != null) v.maxDecimals = def.maxDecimals;
  return { value: v };
}

const input = {
  dataCollection: "OkrObjective",
  prefix: "OBJ",
  displayName: "OKR Objective",
  icon: "Target",
  color: "Purple",
  allowMultipleTypes: false,
  allowCommenting: true,
  allowInactive: true,
  allowAttachments: true,
  displayFields: ["title", "level", "status", "progress"],
  fields: [
    vf({ key: "title", label: "Objective", required: true, valueType: "Text" }),
    vf({
      key: "description",
      label: "Beschreibung",
      required: false,
      valueType: "RichText",
    }),
    vf({
      key: "level",
      label: "Ebene",
      required: true,
      valueType: "ComboBox",
      comboBoxOptions: ["company", "team", "individual"],
      size: "Third",
    }),
    vf({
      key: "cycle",
      label: "Zyklus",
      required: true,
      valueType: "DataEntry",
      dataCollection: "OkrCycle",
      size: "Third",
    }),
    vf({
      key: "status",
      label: "Status",
      required: true,
      valueType: "ComboBox",
      comboBoxOptions: ["draft", "on_track", "at_risk", "off_track", "completed"],
      size: "Third",
    }),
    vf({ key: "owner", label: "Owner", required: true, valueType: "User", size: "Half" }),
    vf({
      key: "progress",
      label: "Fortschritt %",
      required: true,
      valueType: "Number",
      maxDecimals: 1,
      size: "Half",
    }),
    vf({
      key: "weight",
      label: "Gewicht",
      required: false,
      valueType: "Number",
      maxDecimals: 2,
      size: "Half",
    }),
  ],
};

const query = `
  mutation($input: CreateDataFormInput!) {
    createDataForm(input: $input) {
      dataForm { id displayName dataCollection }
      errors { __typename ... on Error { message } }
    }
  }
`;

const res = await fetch(env.CONSOLIDATE_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": env.CONSOLIDATE_API_KEY,
  },
  body: JSON.stringify({ query, variables: { input } }),
});
console.log(JSON.stringify(await res.json(), null, 2));
