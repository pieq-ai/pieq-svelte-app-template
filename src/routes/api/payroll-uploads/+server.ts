import { requirePermission } from "$lib/server/guards/permission.guard";
import { json } from "@sveltejs/kit";
import * as service from "$lib/server/services/payroll-upload.service.js";

/** GET /api/payroll-uploads — returns all upload batches, newest first. */
export async function GET({ locals }) {
  try {
    requirePermission(locals.user, "payroll:view");
    const uploads = await service.getPayrollUploads();
    return json({ data: uploads });
  } catch (error) {
    console.error("Error in GET /api/payroll-uploads:", error);
    return json(
      {
        message:
          (error as Error).message ||
          "Failed to retrieve payroll upload records",
      },
      { status: 500 },
    );
  }
}
