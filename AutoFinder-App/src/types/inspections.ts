export type UserRole = "user" | "inspector" | "admin";

export interface User {
	userId: string;
	name: string;
	email: string;
	phone: string;
	role: UserRole;
}

export interface InspectorProfile {
	inspectorId: string;
	userId: string;
	name: string;
	phone: string;
	licenseNo: string;
	region?: string;
	isActive: boolean;
	rating: number;
	kycDocs: string[];
	createdAt: string; // ISO
}

export interface Ad {
	adId: string;
	ownerId: string;
	title: string;
	isPremium: boolean;
	isManagedByAutoFinder: boolean;
	status: "pending" | "approved" | "rejected";
	isInspected: boolean;
	inspectionId: string | null;
	inspectionScore: number | null;
}

export type RequestType = "free" | "paid" | "managed";
export type RequestStatus = "pending" | "assigned" | "canceled" | "completed";

export interface InspectionRequest {
	requestId: string;
	adId: string;
	requestedBy: string; // userId
	requestType: RequestType;
	receiptUrl?: string | null;
	status: RequestStatus;
	createdAt: string; // ISO
	assignedInspectorId: string | null;
}

export interface ChecklistItem {
	id: string;
	label: string;
	rating: number; // 1..5
	notes?: string;
	photos?: string[];
}

export interface ChecklistSection {
	weight: number; // percentage weight
	items: ChecklistItem[];
}

export type OverallRating = "Excellent" | "Good" | "Fair" | "Poor";

export interface InspectionReport {
	inspectionId: string;
	adId: string;
	requestedBy: string;
	inspectorId: string;
	requestType: RequestType;
	status: "submitted" | "approved" | "rejected";
	requestedAt?: string | null;
	assignedAt?: string | null;
	inspectedAt: string; // ISO
	overallScore: number; // 0..100
	overallRating: OverallRating;
	verdict: string;
	summary: string;
	detailedChecklist: {
		engine?: ChecklistSection;
		brakes?: ChecklistSection;
		suspension?: ChecklistSection;
		interior?: ChecklistSection;
		ac?: ChecklistSection;
		electrical?: ChecklistSection;
		exterior?: ChecklistSection;
		tyres?: ChecklistSection;
		testDrive?: ChecklistSection;
	};
	photos: Array<{
		url: string;
		lat?: number;
		lon?: number;
		timestamp?: string; // ISO
		itemId?: string;
	}>;
	documents?: string[];
	signatureUrl?: string | null;
	pdfUrl?: string | null;
	verificationCode: string;
	expiryDate?: string | null;
	createdAt: string; // ISO
}

export type ApiResult<T> = {
	success: boolean;
	data?: T;
	message?: string;
}


