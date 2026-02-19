import type { InspectionReport, ChecklistSection, OverallRating } from "../types/inspections";

// Default category weights summing to 100
export const DEFAULT_WEIGHTS: Record<string, number> = {
	engine: 25,
	brakes: 10,
	suspension: 10,
	interior: 10,
	electrical: 10,
	exterior: 20,
	tyres: 5,
	testDrive: 10,
};

function scoreSection(section?: ChecklistSection): number {
	if (!section || !Array.isArray(section.items) || section.items.length === 0) return 0;
	const maxRatingPerItem = 5;
	const totalGiven = section.items.reduce((sum, it) => sum + Math.max(0, Math.min(maxRatingPerItem, Number(it.rating) || 0)), 0);
	const maxPossible = maxRatingPerItem * section.items.length;
	return maxPossible > 0 ? (totalGiven / maxPossible) * 100 : 0; // 0..100
}

export function computeOverallScore(
	sections: InspectionReport["detailedChecklist"],
	weights: Record<string, number> = DEFAULT_WEIGHTS
): { overallScore: number; verdict: OverallRating } {
	let total = 0;
	Object.keys(weights).forEach((key) => {
		const w = Math.max(0, Number(weights[key]) || 0);
		const section = (sections as any)[key] as ChecklistSection | undefined;
		const sectionScore = scoreSection(section); // 0..100
		const weighted = sectionScore * (w / 100);
		total += weighted;
	});

	// Clamp and round to 1 decimal
	const overallScore = Math.max(0, Math.min(100, Math.round(total * 10) / 10));
	const verdict: OverallRating = overallScore >= 90
		? "Excellent"
		: overallScore >= 75
		? "Good"
		: overallScore >= 50
		? "Fair"
		: "Poor";

	return { overallScore, verdict };
}


