import { API_URL } from "../../config";
import { getAuthHeaders } from "../utils/authUtils";
import type {
	InspectorProfile,
	InspectionRequest,
	InspectionReport,
	ApiResult,
	RequestType,
} from "../types/inspections";

export async function getInspectorProfile(inspectorId: string): Promise<ApiResult<InspectorProfile>> {
    const res = await fetch(`${API_URL}/inspectors/${inspectorId}`, { headers: await getAuthHeaders() });
	const data = await res.json();
	return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.1 POST /api/inspection/request — user requests inspection
export async function requestInspection(params: {
    adId: string;
    requestType: RequestType;
    receiptUrl?: string | null;
    notes?: string;
}): Promise<ApiResult<{ requestId: string }>> {
    const res = await fetch(`${API_URL}/api/inspection/request`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(params),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.2 GET /api/admin/inspection/requests?status=pending — admin list
export async function listInspectionRequests(status: string = "pending"): Promise<ApiResult<{ requests: InspectionRequest[] }>> {
    const res = await fetch(`${API_URL}/api/admin/inspection/requests?status=${encodeURIComponent(status)}`, {
        headers: await getAuthHeaders(),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.3 POST /api/admin/inspection/assign — admin assigns inspector
export async function assignInspection(params: {
    requestId: string;
    inspectorId: string;
    scheduledAt: string; // ISO
}): Promise<ApiResult<{ inspectionId: string }>> {
    const res = await fetch(`${API_URL}/api/admin/inspection/assign`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(params),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.4 POST /api/inspection/:inspectionId/start — inspector accepts (optional)
export async function startInspection(inspectionId: string): Promise<ApiResult<{ status: string }>> {
    const res = await fetch(`${API_URL}/api/inspection/${inspectionId}/start`, {
        method: "POST",
        headers: await getAuthHeaders(),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.5A POST /api/inspection/:inspectionId/upload-url — presigned URL
export async function getUploadUrl(inspectionId: string, body: { filename: string; contentType: string }): Promise<ApiResult<{ uploadUrl: string; fileUrl: string }>> {
    const res = await fetch(`${API_URL}/api/inspection/${inspectionId}/upload-url`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 4 — Photos confirm metadata
export async function confirmPhotoMetadata(inspectionId: string, meta: { url: string; itemId: string; lat?: number; lon?: number; timestamp?: string; providedTimestamp?: string }): Promise<ApiResult<{ ok: boolean }>> {
    const res = await fetch(`${API_URL}/api/inspection/${inspectionId}/photos/confirm`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(meta),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.6 POST /api/inspection/:inspectionId/submit — submit filled checklist
export async function submitInspection(inspectionId: string, body: {
    inspectionId: string;
    checklist: InspectionReport["detailedChecklist"];
    photosMeta: Array<{ url: string; itemId: string; lat?: number; lon?: number; timestamp?: string }>;
    signatureUrl?: string | null;
    notes?: string;
}): Promise<ApiResult<{ inspectionId: string }>> {
    const res = await fetch(`${API_URL}/api/inspection/${inspectionId}/submit`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.7 GET /api/inspection/:inspectionId — public read (if approved)
export async function getInspectionPublic(inspectionId: string): Promise<ApiResult<InspectionReport>> {
    const res = await fetch(`${API_URL}/api/inspection/${inspectionId}`);
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// Get detailed inspection report by inspection ID
export async function getInspectionReport(inspectionId: string): Promise<ApiResult<InspectionReport>> {
    const res = await fetch(`${API_URL}/inspection_report/${inspectionId}`);
    const data = await res.json();
    return { success: res.ok, data: data.data, message: !res.ok ? data?.message : undefined };
}

// 3.8 POST /api/admin/inspection/:inspectionId/approve — admin approve
export async function approveInspection(inspectionId: string): Promise<ApiResult<InspectionReport>> {
    const res = await fetch(`${API_URL}/api/admin/inspection/${inspectionId}/approve`, {
        method: "POST",
        headers: await getAuthHeaders(),
    });
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}

// 3.9 GET /api/inspection/verify/:verificationCode — public verification page
export async function verifyInspection(verificationCode: string): Promise<ApiResult<InspectionReport>> {
    const res = await fetch(`${API_URL}/api/inspection/verify/${verificationCode}`);
    const data = await res.json();
    return { success: res.ok, data, message: !res.ok ? data?.message : undefined };
}


