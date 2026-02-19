export function formatIso(value?: string | number | Date | null): string {
	if (!value) return "—";
	try {
		const d = new Date(value);
		if (isNaN(d.getTime())) return "—";
		return d.toLocaleDateString();
	} catch {
		return "—";
	}
}

export function safeText(value?: string | number | null): string {
	if (value === null || value === undefined) return "—";
	const s = String(value).trim();
	return s.length ? s : "—";
}

export function withUnitNumber(raw: string | null | undefined, unit: string): string {
	if (!raw) return "—";
	const num = raw.replace(/\D/g, "");
	return num ? `${num} ${unit}` : "—";
}


