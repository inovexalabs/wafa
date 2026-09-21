"use client";

import { useEffect, useRef, useState } from "react";
import { listMeetingRecipients, MeetingRecipient } from "../lib/auth";

const groupDefinitions: { key: string; label: string; roles: MeetingRecipient["role"][] }[] = [
	{ key: "admins", label: "Admins", roles: ["superadmin", "admin"] },
	{ key: "accountant", label: "Accountants", roles: ["accountant"] },
	{ key: "member", label: "Members", roles: ["member"] },
];

export function useMeetingRecipients(role: "admin" | "superadmin") {
	const [recipients, setRecipients] = useState<MeetingRecipient[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		listMeetingRecipients(role)
			.then(setRecipients)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load recipients."))
			.finally(() => setIsLoading(false));
	}, [role]);

	return { recipients, isLoading, error };
}

function GroupCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = indeterminate;
	}, [indeterminate]);
	return <input ref={ref} className="w-auto h-auto m-0" type="checkbox" checked={checked} onChange={onChange} />;
}

export default function RecipientPicker({
	recipients,
	selection,
	onToggle,
	onToggleGroup,
}: {
	recipients: MeetingRecipient[];
	selection: string[];
	onToggle: (id: string) => void;
	onToggleGroup: (ids: string[], checked: boolean) => void;
}) {
	const groups = groupDefinitions
		.map((def) => ({ ...def, people: recipients.filter((person) => def.roles.includes(person.role)) }))
		.filter((group) => group.people.length > 0);

	if (!groups.length) return <p className="px-[7px] py-2 text-[#9aa8a1] text-[11px]">No recipients available yet.</p>;

	return (
		<div className="grid gap-3">
			{groups.map((group) => {
				const groupIds = group.people.map((person) => person.id);
				const selectedInGroup = groupIds.filter((id) => selection.includes(id)).length;
				const allSelected = selectedInGroup === groupIds.length;
				const someSelected = selectedInGroup > 0 && !allSelected;
				return (
					<div key={group.key} className="border border-line rounded-md overflow-hidden">
						<label className="flex items-center gap-[9px] px-[10px] py-2 bg-[#f7faf7] text-[11px] font-bold text-[#2d4037] cursor-pointer">
							<GroupCheckbox checked={allSelected} indeterminate={someSelected} onChange={() => onToggleGroup(groupIds, !allSelected)} />
							<span>{group.label}</span>
							<span className="ml-auto text-[10px] font-normal text-[#8b9992]">{selectedInGroup ? `${selectedInGroup}/${groupIds.length}` : groupIds.length}</span>
						</label>
						<div className="px-1 py-[6px]">
							{group.people.map((person) => (
								<label className="flex items-center gap-[9px] px-[7px] py-2 rounded-md text-xs text-[#2d4037] cursor-pointer hover:bg-[#f2f7f3]" key={person.id}>
									<input className="w-auto h-auto m-0" type="checkbox" checked={selection.includes(person.id)} onChange={() => onToggle(person.id)} />
									<span>{person.fullName} {person.email && <small className="text-[#8b9992] text-[10px]">{person.email}</small>}</span>
								</label>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function toggleRecipient(selection: string[], id: string): string[] {
	return selection.includes(id) ? selection.filter((current) => current !== id) : [...selection, id];
}

export function toggleRecipientGroup(selection: string[], ids: string[], checked: boolean): string[] {
	const set = new Set(selection);
	ids.forEach((id) => (checked ? set.add(id) : set.delete(id)));
	return Array.from(set);
}
