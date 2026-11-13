/**
 * Field definitions for OKR DataForms in Consolidate.
 *
 * Note: DataEntry fields may only target system collections (Contact, Company,
 * Project, Task). Cross-links between custom OKR collections use Text IDs
 * (`cycleId`, `objectiveId`, …). Associations can be layered on later.
 */

export type FieldValueType =
  | "Text"
  | "Number"
  | "Date"
  | "RichText"
  | "Checkbox"
  | "DataEntry"
  | "User"
  | "ComboBox";

export interface ValueFieldDef {
  key: string;
  label: string;
  required: boolean;
  valueType: FieldValueType;
  selectionType?: "Single" | "List";
  dataCollection?: string;
  comboBoxOptions?: string[];
  maxDecimals?: number;
  helpText?: string;
  searchable?: boolean;
  section?: "Main" | "Additional";
  size?: "Full" | "Half" | "Third" | "TwoThirds";
}

export interface DataFormDefinition {
  dataCollection: string;
  prefix: string;
  displayName: string;
  icon: string;
  color: "Blue" | "Purple" | "Teal" | "Green" | "Sky" | "Amber";
  allowCommenting: boolean;
  allowAttachments: boolean;
  allowInactive?: boolean;
  allowMultipleTypes?: boolean;
  displayFields: string[];
  fields: ValueFieldDef[];
}

export function valueFieldInput(def: ValueFieldDef) {
  const value: Record<string, unknown> = {
    key: def.key,
    label: def.label,
    required: def.required,
    valueType: def.valueType,
    selectionType: def.selectionType ?? "Single",
    searchable: def.searchable ?? true,
    archived: false,
    // Consolidate NRE if these list fields are omitted/null
    validators: [],
    security: [],
    allowedValues: [],
    requiresManagePermissions: false,
    section: def.section ?? "Main",
    size: def.size ?? "Full",
  };

  if (def.dataCollection) value.dataCollection = def.dataCollection;
  if (def.helpText) value.helpText = def.helpText;
  if (def.comboBoxOptions?.length) value.comboBoxOptions = def.comboBoxOptions;
  if (typeof def.maxDecimals === "number") value.maxDecimals = def.maxDecimals;

  return { value };
}

export function toCreateDataFormInput(def: DataFormDefinition) {
  return {
    dataCollection: def.dataCollection,
    prefix: def.prefix,
    displayName: def.displayName,
    icon: def.icon,
    color: def.color,
    allowMultipleTypes: def.allowMultipleTypes ?? false,
    allowCommenting: def.allowCommenting,
    allowInactive: def.allowInactive ?? true,
    allowAttachments: def.allowAttachments,
    displayFields: def.displayFields,
    fields: def.fields.map(valueFieldInput),
  };
}

/** Creation order: independent collections first. */
export const OKR_DATA_FORMS: DataFormDefinition[] = [
  {
    dataCollection: "OkrCycle",
    prefix: "CYC",
    displayName: "OKR Zyklus",
    icon: "Calendar",
    color: "Blue",
    allowCommenting: true,
    allowAttachments: false,
    // ComboBox/RichText are NOT valid display fields in Consolidate
    displayFields: ["title", "startDate", "endDate"],
    fields: [
      { key: "title", label: "Titel", required: true, valueType: "Text" },
      {
        key: "description",
        label: "Beschreibung",
        required: false,
        valueType: "RichText",
      },
      {
        key: "startDate",
        label: "Start",
        required: true,
        valueType: "Date",
        size: "Half",
      },
      {
        key: "endDate",
        label: "Ende",
        required: true,
        valueType: "Date",
        size: "Half",
      },
      {
        key: "cycleType",
        label: "Typ",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: ["quarter", "year", "custom"],
        size: "Half",
      },
      {
        key: "status",
        label: "Status",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: ["draft", "active", "closed"],
        size: "Half",
      },
    ],
  },
  {
    dataCollection: "OkrObjective",
    prefix: "OBJ",
    displayName: "OKR Objective",
    icon: "Target",
    color: "Purple",
    allowCommenting: true,
    allowAttachments: true,
    displayFields: ["title", "progress"],
    fields: [
      { key: "title", label: "Objective", required: true, valueType: "Text" },
      {
        key: "description",
        label: "Beschreibung",
        required: false,
        valueType: "RichText",
      },
      {
        key: "level",
        label: "Ebene",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: ["company", "team", "individual"],
        size: "Third",
      },
      {
        key: "cycleId",
        label: "Zyklus-ID",
        required: true,
        valueType: "Text",
        size: "Third",
        helpText: "Consolidate-ID des OkrCycle-Eintrags",
      },
      {
        key: "status",
        label: "Status",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: [
          "draft",
          "on_track",
          "at_risk",
          "off_track",
          "completed",
        ],
        size: "Third",
      },
      {
        key: "parentObjectiveId",
        label: "Parent-Objective-ID",
        required: false,
        valueType: "Text",
        size: "Half",
        helpText: "Alignment: ID des übergeordneten Objectives",
      },
      {
        key: "owner",
        label: "Owner",
        required: true,
        valueType: "User",
        size: "Half",
      },
      {
        key: "teamId",
        label: "Team-ID",
        required: false,
        valueType: "Text",
        size: "Half",
        section: "Additional",
      },
      {
        key: "teamName",
        label: "Team",
        required: false,
        valueType: "Text",
        size: "Half",
        section: "Additional",
      },
      {
        key: "progress",
        label: "Fortschritt %",
        required: true,
        valueType: "Number",
        maxDecimals: 1,
        size: "Half",
        helpText: "Automatisch aus gewichteten Key Results berechnet",
      },
      {
        key: "weight",
        label: "Gewicht",
        required: false,
        valueType: "Number",
        maxDecimals: 2,
        size: "Half",
      },
    ],
  },
  {
    dataCollection: "OkrKeyResult",
    prefix: "KR",
    displayName: "OKR Key Result",
    icon: "Chart",
    color: "Teal",
    allowCommenting: true,
    allowAttachments: false,
    displayFields: ["title", "currentValue"],
    fields: [
      { key: "title", label: "Key Result", required: true, valueType: "Text" },
      {
        key: "description",
        label: "Beschreibung",
        required: false,
        valueType: "RichText",
      },
      {
        key: "objectiveId",
        label: "Objective-ID",
        required: true,
        valueType: "Text",
        size: "Half",
        helpText: "Consolidate-ID des OkrObjective-Eintrags",
      },
      {
        key: "owner",
        label: "Owner",
        required: true,
        valueType: "User",
        size: "Half",
      },
      {
        key: "metricType",
        label: "Metrik",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: ["percent", "currency", "number", "boolean"],
        size: "Third",
      },
      {
        key: "unit",
        label: "Einheit",
        required: false,
        valueType: "Text",
        size: "Third",
      },
      {
        key: "status",
        label: "Status",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: ["on_track", "at_risk", "off_track"],
        size: "Third",
      },
      {
        key: "startValue",
        label: "Startwert",
        required: true,
        valueType: "Number",
        maxDecimals: 4,
        size: "Third",
      },
      {
        key: "targetValue",
        label: "Zielwert",
        required: true,
        valueType: "Number",
        maxDecimals: 4,
        size: "Third",
      },
      {
        key: "currentValue",
        label: "Ist-Wert",
        required: true,
        valueType: "Number",
        maxDecimals: 4,
        size: "Third",
      },
      {
        key: "weight",
        label: "Gewicht",
        required: true,
        valueType: "Number",
        maxDecimals: 2,
        size: "Half",
      },
      {
        key: "dueDate",
        label: "Fällig",
        required: false,
        valueType: "Date",
        size: "Half",
      },
    ],
  },
  {
    dataCollection: "OkrCheckIn",
    prefix: "CHK",
    displayName: "OKR Check-in",
    icon: "Check",
    color: "Green",
    allowCommenting: false,
    allowAttachments: false,
    displayFields: ["title", "value", "checkInDate"],
    fields: [
      { key: "title", label: "Titel", required: true, valueType: "Text" },
      {
        key: "keyResultId",
        label: "Key-Result-ID",
        required: true,
        valueType: "Text",
        size: "Half",
        helpText: "Consolidate-ID des OkrKeyResult-Eintrags",
      },
      {
        key: "author",
        label: "Autor",
        required: true,
        valueType: "User",
        size: "Half",
      },
      {
        key: "value",
        label: "Neuer Wert",
        required: true,
        valueType: "Number",
        maxDecimals: 4,
        size: "Third",
      },
      {
        key: "status",
        label: "Ampel",
        required: true,
        valueType: "ComboBox",
        comboBoxOptions: ["on_track", "at_risk", "off_track"],
        size: "Third",
      },
      {
        key: "checkInDate",
        label: "Datum",
        required: true,
        valueType: "Date",
        size: "Third",
      },
      {
        key: "comment",
        label: "Kommentar",
        required: false,
        valueType: "Text",
      },
    ],
  },
];
