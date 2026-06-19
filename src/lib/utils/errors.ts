export function parseBackendErrors(body: any): { field?: string; message: string } {
    if (body?.data?.field && body?.data?.message) {
        return { field: body.data.field, message: body.data.message };
    }
    if (body?.data?.error) {
        return { message: body.data.error };
    }
    if (body?.field && body?.message) {
        return { field: body.field, message: body.message };
    }
    if (body?.error) {
        return { message: body.error };
    }
    if (body?.message) {
        return { message: body.message };
    }
    return { message: 'Something went wrong.' };
}
