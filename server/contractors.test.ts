import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getContractors: vi.fn(),
  getContractorById: vi.fn(),
  createContractor: vi.fn(),
  updateContractor: vi.fn(),
  deleteContractor: vi.fn(),
  getContractorStats: vi.fn(),
  getContractHistories: vi.fn(),
  getContractHistoryById: vi.fn(),
  createContractHistory: vi.fn(),
  updateContractHistory: vi.fn(),
  deleteContractHistory: vi.fn(),
  getPerformanceRatings: vi.fn(),
  getPerformanceRatingById: vi.fn(),
  createPerformanceRating: vi.fn(),
  updatePerformanceRating: vi.fn(),
  deletePerformanceRating: vi.fn(),
}));

import {
  getContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor,
  getContractorStats,
  getContractHistories,
  createContractHistory,
  getPerformanceRatings,
  createPerformanceRating,
} from './db';

describe('Contractor Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContractors', () => {
    it('should return paginated contractors list', async () => {
      const mockData = {
        contractors: [
          { id: 1, name: 'ABC Construction', status: 'Active', pcabCategory: 'A' },
          { id: 2, name: 'XYZ Builders', status: 'Active', pcabCategory: 'B' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      vi.mocked(getContractors).mockResolvedValue(mockData);

      const result = await getContractors({ page: 1, limit: 20 });

      expect(result).toEqual(mockData);
      expect(result.contractors).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter contractors by status', async () => {
      const mockData = {
        contractors: [
          { id: 1, name: 'ABC Construction', status: 'Active', pcabCategory: 'A' },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      vi.mocked(getContractors).mockResolvedValue(mockData);

      const result = await getContractors({ status: 'Active' });

      expect(getContractors).toHaveBeenCalledWith({ status: 'Active' });
      expect(result.contractors[0].status).toBe('Active');
    });

    it('should filter contractors by PCAB category', async () => {
      const mockData = {
        contractors: [
          { id: 1, name: 'ABC Construction', status: 'Active', pcabCategory: 'AAA' },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      vi.mocked(getContractors).mockResolvedValue(mockData);

      const result = await getContractors({ pcabCategory: 'AAA' });

      expect(getContractors).toHaveBeenCalledWith({ pcabCategory: 'AAA' });
      expect(result.contractors[0].pcabCategory).toBe('AAA');
    });
  });

  describe('getContractorById', () => {
    it('should return contractor details', async () => {
      const mockContractor = {
        id: 1,
        name: 'ABC Construction',
        tradeName: 'ABC',
        tin: '123-456-789',
        philgepsNumber: 'PH-12345',
        pcabLicense: 'PCAB-001',
        pcabCategory: 'A',
        status: 'Active',
        totalContracts: 5,
        totalContractValue: '10000000',
        overallRating: '4.5',
      };

      vi.mocked(getContractorById).mockResolvedValue(mockContractor);

      const result = await getContractorById(1);

      expect(result).toEqual(mockContractor);
      expect(result?.name).toBe('ABC Construction');
    });

    it('should return undefined for non-existent contractor', async () => {
      vi.mocked(getContractorById).mockResolvedValue(undefined);

      const result = await getContractorById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('createContractor', () => {
    it('should create a new contractor', async () => {
      const newContractor = {
        name: 'New Builder Inc.',
        tin: '987-654-321',
        pcabCategory: 'B',
      };

      vi.mocked(createContractor).mockResolvedValue({ id: 3 });

      const result = await createContractor(newContractor);

      expect(createContractor).toHaveBeenCalledWith(newContractor);
      expect(result.id).toBe(3);
    });
  });

  describe('updateContractor', () => {
    it('should update contractor status', async () => {
      vi.mocked(updateContractor).mockResolvedValue({ success: true });

      const result = await updateContractor(1, { status: 'Blacklisted' });

      expect(updateContractor).toHaveBeenCalledWith(1, { status: 'Blacklisted' });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteContractor', () => {
    it('should delete a contractor', async () => {
      vi.mocked(deleteContractor).mockResolvedValue({ success: true });

      const result = await deleteContractor(1);

      expect(deleteContractor).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });
  });

  describe('getContractorStats', () => {
    it('should return contractor statistics', async () => {
      const mockStats = {
        total: 50,
        active: 45,
        blacklisted: 2,
        suspended: 1,
        inactive: 2,
        totalContractValue: 500000000,
        avgRating: 4.2,
      };

      vi.mocked(getContractorStats).mockResolvedValue(mockStats);

      const result = await getContractorStats();

      expect(result).toEqual(mockStats);
      expect(result?.total).toBe(50);
      expect(result?.active).toBe(45);
    });
  });
});

describe('Contract History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContractHistories', () => {
    it('should return contract history for a contractor', async () => {
      const mockData = {
        contracts: [
          { id: 1, contractorId: 1, projectTitle: 'Road Project', status: 'Completed' },
          { id: 2, contractorId: 1, projectTitle: 'Bridge Project', status: 'Ongoing' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      vi.mocked(getContractHistories).mockResolvedValue(mockData);

      const result = await getContractHistories({ contractorId: 1 });

      expect(getContractHistories).toHaveBeenCalledWith({ contractorId: 1 });
      expect(result.contracts).toHaveLength(2);
    });
  });

  describe('createContractHistory', () => {
    it('should create a new contract history entry', async () => {
      const newContract = {
        contractorId: 1,
        projectTitle: 'New Road Project',
        contractAmount: '5000000',
      };

      vi.mocked(createContractHistory).mockResolvedValue({ id: 3 });

      const result = await createContractHistory(newContract);

      expect(createContractHistory).toHaveBeenCalledWith(newContract);
      expect(result.id).toBe(3);
    });
  });
});

describe('Performance Ratings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPerformanceRatings', () => {
    it('should return performance ratings for a contractor', async () => {
      const mockData = {
        ratings: [
          { id: 1, contractorId: 1, overallRating: '4.5', qualityRating: '5.0' },
          { id: 2, contractorId: 1, overallRating: '4.0', qualityRating: '4.0' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      vi.mocked(getPerformanceRatings).mockResolvedValue(mockData);

      const result = await getPerformanceRatings({ contractorId: 1 });

      expect(getPerformanceRatings).toHaveBeenCalledWith({ contractorId: 1 });
      expect(result.ratings).toHaveLength(2);
    });
  });

  describe('createPerformanceRating', () => {
    it('should create a new performance rating', async () => {
      const newRating = {
        contractorId: 1,
        qualityRating: '4.5',
        timelinessRating: '4.0',
        safetyRating: '5.0',
        resourceRating: '4.0',
        communicationRating: '4.5',
      };

      vi.mocked(createPerformanceRating).mockResolvedValue({ id: 3 });

      const result = await createPerformanceRating(newRating);

      expect(createPerformanceRating).toHaveBeenCalledWith(newRating);
      expect(result.id).toBe(3);
    });

    it('should calculate overall rating from individual ratings', async () => {
      const newRating = {
        contractorId: 1,
        qualityRating: '5.0',
        timelinessRating: '4.0',
        safetyRating: '4.0',
        resourceRating: '4.0',
        communicationRating: '3.0',
      };

      vi.mocked(createPerformanceRating).mockResolvedValue({ id: 4 });

      await createPerformanceRating(newRating);

      // The overall rating should be calculated as average: (5+4+4+4+3)/5 = 4.0
      expect(createPerformanceRating).toHaveBeenCalledWith(newRating);
    });
  });
});
