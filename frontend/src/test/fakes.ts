import { vi } from "vitest";
import type { AppServices } from "../application/services";

export function createTestServices(): AppServices {
  return {
    sessions: { get: vi.fn(), save: vi.fn(), clear: vi.fn(), subscribe: vi.fn(() => () => undefined) },
    login: { execute: vi.fn() },
    restoreSession: { execute: vi.fn().mockResolvedValue(null) },
    logout: { execute: vi.fn().mockResolvedValue(undefined) },
    getOperationalReport: { execute: vi.fn() },
    registerReader: { execute: vi.fn() },
    getReader: { execute: vi.fn() },
    updateReader: { execute: vi.fn() },
    renewReaderCard: { execute: vi.fn() },
    changeCardStatus: { execute: vi.fn() },
    borrowBooks: { execute: vi.fn() },
    returnBooks: { execute: vi.fn() },
    listReaderLoans: { execute: vi.fn() },
    listReservations: { execute: vi.fn() },
    cancelReservation: { execute: vi.fn() },
    allocateReservation: { execute: vi.fn() },
    searchCatalog: { execute: vi.fn() },
    listCatalogBranches: { execute: vi.fn().mockResolvedValue([]) },
    listCatalogShelves: { execute: vi.fn().mockResolvedValue([]) },
    listCatalogCopies: { execute: vi.fn().mockResolvedValue([]) },
    createCatalogTitle: { execute: vi.fn() },
    updateCatalogTitle: { execute: vi.fn() },
    createCatalogBranch: { execute: vi.fn() },
    createCatalogShelf: { execute: vi.fn() },
    createCatalogCopy: { execute: vi.fn() },
    updateCatalogCopy: { execute: vi.fn() },
    listReaderFines: { execute: vi.fn().mockResolvedValue([]) },
    listReaderPayments: { execute: vi.fn().mockResolvedValue([]) },
    createPayment: { execute: vi.fn() },
    simulatePayment: { execute: vi.fn() },
  };
}
