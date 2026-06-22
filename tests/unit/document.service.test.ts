import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as documentService from '$lib/server/services/document.service.js';
import * as documentDao from '$lib/server/dao/document.dao.js';
import * as employeeDao from '$lib/server/dao/employee.dao.js';

vi.mock('$lib/server/dao/document.dao.js', () => ({
	findByEmployeeCuid: vi.fn(),
	replaceDocuments: vi.fn(),
	findByCuid: vi.fn()
}));

vi.mock('$lib/server/dao/employee.dao.js', () => ({
	findByCuid2: vi.fn()
}));

vi.mock('$lib/server/services/employee.service.js', () => ({
	checkAndSetProfileCompletionStatus: vi.fn().mockResolvedValue({})
}));

describe('Document Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getDocumentByCuid', () => {
		it('should throw an error if CUID is missing', async () => {
			await expect(documentService.getDocumentByCuid('')).rejects.toThrow('Document CUID2 is required');
		});

		it('should throw an error if document is not found', async () => {
			vi.mocked(documentDao.findByCuid).mockResolvedValue(null);
			await expect(documentService.getDocumentByCuid('doc123')).rejects.toThrow('Document with CUID2 "doc123" not found');
		});

		it('should return the document when found', async () => {
			const mockDoc = { id: 1n, cuid: 'doc123', file_name: 'test.pdf', document: Buffer.from('hello') };
			vi.mocked(documentDao.findByCuid).mockResolvedValue(mockDoc as any);

			const result = await documentService.getDocumentByCuid('doc123');
			expect(result).toEqual(mockDoc);
			expect(documentDao.findByCuid).toHaveBeenCalledWith('doc123');
		});
	});

	describe('replaceDocuments', () => {
		it('should throw if employee is not found', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue(null);
			await expect(documentService.replaceDocuments('emp123', [])).rejects.toThrow('Employee with CUID2 "emp123" not found');
		});

		it('should convert base64 to buffer and call replaceDocuments in DAO', async () => {
			vi.mocked(employeeDao.findByCuid2).mockResolvedValue({ id: 1n, cuid: 'emp123' } as any);
			
			const mockSavedDocs = [
				{ id: 1n, cuid: 'doc123', document_type_cuid: 'type1', file_name: 'test.pdf', file_size: 100n, mime_type: 'application/pdf' }
			];
			vi.mocked(documentDao.replaceDocuments).mockResolvedValue(mockSavedDocs as any);

			const dtos: documentService.UpsertDocumentDto[] = [
				{
					cuid: 'doc123',
					document_type_cuid: 'type1',
					file_name: 'test.pdf',
					file_size: 100,
					mime_type: 'application/pdf',
					document_base64: 'data:application/pdf;base64,JVBERi0xLjQK'
				}
			];

			const result = await documentService.replaceDocuments('emp123', dtos);

			expect(documentDao.replaceDocuments).toHaveBeenCalledTimes(1);
			const expectedPayload = [
				{
					cuid: 'doc123',
					document_type_cuid: 'type1',
					file_name: 'test.pdf',
					file_size: 100n,
					mime_type: 'application/pdf',
					document: Buffer.from('%PDF-1.4\n'),
					created_by: undefined,
					updated_by: undefined
				}
			];
			expect(documentDao.replaceDocuments).toHaveBeenCalledWith('emp123', expectedPayload);
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				cuid: 'doc123',
				document_type_cuid: 'type1',
				file_name: 'test.pdf',
				file_size: 100,
				mime_type: 'application/pdf'
			});
		});
	});
});
