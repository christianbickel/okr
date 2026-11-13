# Consolidate-Datenschema (OKR Add-On)

Alle OKR-Daten liegen in **eigenen Datensammlungen** in Consolidate 6.
Die GraphQL-API erzeugt nach Anlage der Formulare typisierte Endpunkte:

- Queries: `dataEntries_{Collection}`, `dataEntry_{Collection}`
- Mutations: `create{Collection}`, `update{Collection}`
- Generisch: `createDataEntry` / `updateDataEntries`

Authentifizierung: Header `X-API-Key` (benutzerspezifisch).  
Mandantentrennung: über Consolidate-Tenant + Entity-Security (keine eigene DB).

## Rollenmodell

| Rolle | Consolidate-Abbildung | Rechte (MVP) |
|---|---|---|
| **Admin** | Role `okr-admin` | Zyklen, Company-OKRs, Rollen, alle Teams |
| **Team-Lead** | Role `okr-team-lead` | Team-OKRs, Check-ins, Alignment im Team |
| **Mitarbeiter** | Role `okr-member` | Eigene OKRs, Check-ins, Lesen Alignment |

Consolidate-`Team` und `User` werden referenziert (keine doppelte User-DB).

---

## 1. Datensammlung `OkrCycle`

**Prefix:** `CYC` · **Icon:** `calendar` · **Color:** `Blue`

| Key | Label | valueType | Pflicht | Auswahl / Notes |
|---|---|---|---|---|
| `title` | Titel | Text (System) | ja | z. B. `Q1 2026` |
| `description` | Beschreibung | RichText | nein | |
| `startDate` | Start | Date | ja | |
| `endDate` | Ende | Date | ja | |
| `cycleType` | Typ | ComboBox | ja | `quarter`, `year`, `custom` |
| `status` | Status | ComboBox | ja | `draft`, `active`, `closed` |

---

## 2. Datensammlung `OkrObjective`

**Prefix:** `OBJ` · **Icon:** `target` · **Color:** `Indigo`  
**allowCommenting:** true · **allowAttachments:** true

| Key | Label | valueType | Pflicht | Auswahl / Notes |
|---|---|---|---|---|
| `title` | Objective | Text (System) | ja | |
| `description` | Beschreibung | RichText | nein | |
| `level` | Ebene | ComboBox | ja | `company`, `team`, `individual` |
| `cycleId` | Zyklus-ID | Text | ja | ID des `OkrCycle`-Eintrags (DataEntry nur für System-Sammlungen) |
| `parentObjectiveId` | Parent-Objective-ID | Text | nein | Alignment; Root = Company |
| `owner` | Owner | User | ja | |
| `teamId` | Team-ID | Text | nein | Consolidate Team-ID |
| `teamName` | Team | Text | nein | denormalisiert für UI |
| `status` | Status | ComboBox | ja | `draft`, `on_track`, `at_risk`, `off_track`, `completed` |
| `progress` | Fortschritt % | Number | ja | 0–100, berechnet, gecacht |
| `weight` | Gewicht | Number | nein | für Parent-Aggregation, Default 1 |

**Associations:** Parent/Children zusätzlich über `addAssociation` möglich (Alignment-Baum).

---

## 3. Datensammlung `OkrKeyResult`

**Prefix:** `KR` · **Icon:** `chart` · **Color:** `Teal`

| Key | Label | valueType | Pflicht | Auswahl / Notes |
|---|---|---|---|---|
| `title` | Key Result | Text (System) | ja | |
| `description` | Beschreibung | RichText | nein | |
| `objectiveId` | Objective-ID | Text | ja | ID des `OkrObjective`-Eintrags |
| `owner` | Owner | User | ja | |
| `metricType` | Metrik | ComboBox | ja | `percent`, `currency`, `number`, `boolean` |
| `unit` | Einheit | Text | nein | `%`, `EUR`, `Stück` … |
| `startValue` | Startwert | Number | ja | Boolean: `0` |
| `targetValue` | Zielwert | Number | ja | Boolean: `1` |
| `currentValue` | Ist-Wert | Number | ja | vom letzten Check-in |
| `weight` | Gewicht | Number | ja | Default `1`, relative Gewichtung |
| `status` | Status | ComboBox | ja | `on_track`, `at_risk`, `off_track` |
| `dueDate` | Fällig | Date | nein | |

---

## 4. Datensammlung `OkrCheckIn`

**Prefix:** `CHK` · **Icon:** `check` · **Color:** `Green`  
**allowCommenting:** false (Kommentar ist Feld)

| Key | Label | valueType | Pflicht | Auswahl / Notes |
|---|---|---|---|---|
| `title` | Titel | Text (System) | ja | Auto: `Check-in 2026-03-12` |
| `keyResultId` | Key-Result-ID | Text | ja | ID des `OkrKeyResult`-Eintrags |
| `author` | Autor | User | ja | |
| `value` | Neuer Wert | Number | ja | |
| `status` | Ampel | ComboBox | ja | `on_track`, `at_risk`, `off_track` |
| `comment` | Kommentar | Text | nein | max. kurz, Check-in-Notiz |
| `checkInDate` | Datum | Date | ja | |

**Nebenwirkung beim Speichern (App-Logik):**  
1. `OkrKeyResult.currentValue` + `status` aktualisieren  
2. Objective-Fortschritt neu berechnen und `OkrObjective.progress`/`status` schreiben

---

## Anzeigefelder (wichtig)

Consolidate erlaubt als Anzeigefelder nur: Text, Zahl, Datum, Benutzer, Status, Priorität, Link, Adresse, E-Mail, Tag, Dateneinträge.  
**Nicht erlaubt:** ComboBox, RichText, Checkbox, …  

Falsche `displayFields` → Speichern schlägt fehl mit  
`field type can not be used as a displayField`.

## Rechte nach dem Seed

Neue Datensammlungen erzeugen Permissions wie `DataEntries.OkrCycle`.  
Rollen und Service-User brauchen diese Rechte, sonst `Unauthorized` beim Speichern.

Im Adminbereich ggf. aktivieren:

1. **Rollen** → `DataEntries.OkrCycle|OkrObjective|OkrKeyResult|OkrCheckIn`
2. **Service-User „OKR“** → dieselben Rechte

## Entity-Security (Mandantentrennung)

Empfohlene Default-Rules beim Create:

| Collection | Admin | Team-Lead (Team) | Member (Owner) | Alle Authentifizierten |
|---|---|---|---|---|
| `OkrCycle` | Manage | Read | Read | Read (aktive Zyklen) |
| `OkrObjective` | Manage | Manage (Team) / Read | Write (own) / Read aligned | Read (sichtbare) |
| `OkrKeyResult` | Manage | Manage (Team) | Write (own) | Read |
| `OkrCheckIn` | Manage | Read+Write Team | Write (own KR) | Read eigene |

Zusätzlich: Field-Security für `progress` (nur System/Lead schreibt berechnet).

---

## Empfohlene DataForm-Anlage (GraphQL-Skizze)

```graphql
mutation CreateOkrCycleForm {
  createDataForm(
    input: {
      dataCollection: "OkrCycle"
      prefix: "CYC"
      displayName: "OKR Zyklus"
      icon: "calendar"
      color: Blue
      allowMultipleTypes: false
      allowCommenting: true
      allowInactive: true
      allowAttachments: false
      displayFields: ["title", "status", "startDate", "endDate"]
      fields: [
        {
          key: "startDate"
          label: "Start"
          required: true
          valueType: Date
          selectionType: Single
          searchable: true
          archived: false
          requiresManagePermissions: false
          section: Main
          size: Half
        }
        # … weitere Felder analog ValueFieldDefinitionInput
      ]
    }
  ) {
    ... on CreateDataFormPayload { dataForm { id displayName } }
    ... on Error { message }
  }
}
```

Nach Anlage erscheinen typisierte Queries/Mutations im Nitro-Schema (`dataEntries_OkrCycle`, `createOkrCycle`, …).

---

## Domain-Modell (logisch)

```
OkrCycle 1──* OkrObjective
OkrObjective 1──* OkrObjective (parent → children, Alignment)
OkrObjective 1──* OkrKeyResult
OkrKeyResult 1──* OkrCheckIn
User / Team  (Consolidate Core) ← referenziert von Objective/KR/CheckIn
```
