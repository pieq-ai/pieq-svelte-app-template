import { requirePermission } from "$lib/server/guards/permission.guard";
import { json } from "@sveltejs/kit";
import * as service from "$lib/server/services/salary-component.service.js";
import { validateCreateSalaryComponent } from "$lib/server/validators/salary-component.validator.js";
import { serializeSalaryComponent } from "$lib/server/serializers/salary-component.serializer.js";

export async function GET({ locals }) {
  try {
    requirePermission(locals.user, "salary_component:view");
    // Fetch all records with a stable default order — search & sort are client-side
    const result = await service.getComponents();

    return json({ data: result.items.map(serializeSalaryComponent) });
  } catch (error) {
    console.error("Error in GET /api/salary-components:", error);
    return json(
      {
        success: false,
        message:
          (error as Error).message || "Failed to retrieve salary components",
      },
      { status: 500 },
    );
  }
}

export async function POST({ locals, request }) {
  try {
    requirePermission(locals.user, "salary_component:view");
    const body = await request.json();

    // Validation step
    const { errors, validatedData } = validateCreateSalaryComponent(body);
    if (errors.length > 0 || !validatedData) {
      const combinedMsg = errors.map((e) => e.message).join(", ");
      return json(
        {
          message: `Validation failed: ${combinedMsg}`,
        },
        { status: 400 },
      );
    }

    // Service creation step
    const created = await service.createComponent(validatedData);

    return json(
      {
        data: {
          cuid: created.cuid,
          message: "success",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/salary-components:", error);
    const isValidationError =
      (error as Error).name === "DuplicateComponentError" ||
      (error as Error).name === "BusinessValidationError";

    return json(
      {
        message:
          (error as Error).message || "Failed to create salary component",
      },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
