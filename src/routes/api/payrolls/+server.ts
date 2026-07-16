import { requirePermission } from "$lib/server/guards/permission.guard";
import { json } from "@sveltejs/kit";
import * as service from "$lib/server/services/payroll.service.js";

export async function GET({ locals }) {
  try {
    requirePermission(locals.user, "payroll:view");
    const payrolls = await service.getPayrolls();
    return json({ data: payrolls });
  } catch (error) {
    console.error("Error in GET /api/payrolls:", error);
    return json(
      {
        message:
          (error as Error).message || "Failed to retrieve payroll records",
      },
      { status: 500 },
    );
  }
}
