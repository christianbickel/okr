import { Label } from "@/components/ui/label";
import type { OkrUserRef } from "@/lib/okr/types";
import { NativeSelect } from "./form-field";

interface UserSelectProps {
  id?: string;
  name?: string;
  label?: string;
  users: OkrUserRef[];
  defaultValue?: string;
  required?: boolean;
}

export function UserSelect({
  id = "ownerId",
  name = "ownerId",
  label = "Owner",
  users,
  defaultValue = "",
  required = true,
}: UserSelectProps) {
  const selected =
    defaultValue && users.some((u) => u.id === defaultValue)
      ? defaultValue
      : "";

  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        name={name}
        required={required}
        defaultValue={selected}
      >
        <option value="" disabled>
          Benutzer wählen…
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id} title={u.email}>
            {u.displayName}
          </option>
        ))}
      </NativeSelect>
      {users.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Keine aktiven Consolidate-User gefunden.
        </p>
      ) : null}
    </div>
  );
}
