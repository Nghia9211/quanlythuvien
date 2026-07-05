import type { AppServices } from "../application/services";
import { LoginUseCase, LogoutUseCase, RestoreSessionUseCase } from "../application/use-cases/auth.use-cases";
import { CreatePaymentUseCase, ListReaderFinesUseCase, ListReaderPaymentsUseCase, SimulatePaymentUseCase } from "../application/use-cases/billing.use-cases";
import { CreateCatalogBranchUseCase, CreateCatalogShelfUseCase, CreateCatalogTitleUseCase, CreateCopyUseCase, ListCatalogBranchesUseCase, ListCatalogCopiesUseCase, ListCatalogShelvesUseCase, SearchCatalogUseCase, UpdateCatalogTitleUseCase, UpdateCopyUseCase } from "../application/use-cases/catalog.use-cases";
import {
  AllocateReservationUseCase,
  BorrowBooksUseCase,
  CancelReservationUseCase,
  ChangeCardStatusUseCase,
  GetOperationalReportUseCase,
  GetReaderUseCase,
  ListReaderLoansUseCase,
  ListReservationsUseCase,
  RegisterReaderUseCase,
  RenewReaderCardUseCase,
  ReturnBooksUseCase,
  UpdateReaderUseCase,
} from "../application/use-cases/library.use-cases";
import { HttpAuthGateway } from "../infrastructure/adapters/http-auth.gateway";
import { HttpBillingGateway } from "../infrastructure/adapters/http-billing.gateway";
import { HttpCatalogGateway } from "../infrastructure/adapters/http-catalog.gateway";
import { HttpCirculationGateway } from "../infrastructure/adapters/http-circulation.gateway";
import { HttpReadersGateway } from "../infrastructure/adapters/http-readers.gateway";
import { HttpReportingGateway } from "../infrastructure/adapters/http-reporting.gateway";
import { HttpReservationsGateway } from "../infrastructure/adapters/http-reservations.gateway";
import { BrowserSessionStore } from "../infrastructure/auth/browser-session-store";
import { HttpClient } from "../infrastructure/http/http-client";

export function createServices(baseUrl = "/api"): AppServices {
  const sessions = new BrowserSessionStore(window.localStorage);
  const client = new HttpClient(baseUrl, sessions);
  const auth = new HttpAuthGateway(client);
  const reports = new HttpReportingGateway(client);
  const readers = new HttpReadersGateway(client);
  const circulation = new HttpCirculationGateway(client);
  const reservations = new HttpReservationsGateway(client);
  const catalog = new HttpCatalogGateway(client);
  const billing = new HttpBillingGateway(client);

  return {
    sessions,
    login: new LoginUseCase(auth, sessions),
    restoreSession: new RestoreSessionUseCase(auth, sessions),
    logout: new LogoutUseCase(auth, sessions),
    getOperationalReport: new GetOperationalReportUseCase(reports),
    registerReader: new RegisterReaderUseCase(readers),
    getReader: new GetReaderUseCase(readers),
    updateReader: new UpdateReaderUseCase(readers),
    renewReaderCard: new RenewReaderCardUseCase(readers),
    changeCardStatus: new ChangeCardStatusUseCase(readers),
    borrowBooks: new BorrowBooksUseCase(circulation),
    returnBooks: new ReturnBooksUseCase(circulation),
    listReaderLoans: new ListReaderLoansUseCase(circulation),
    listReservations: new ListReservationsUseCase(reservations),
    cancelReservation: new CancelReservationUseCase(reservations),
    allocateReservation: new AllocateReservationUseCase(reservations),
    searchCatalog: new SearchCatalogUseCase(catalog),
    listCatalogBranches: new ListCatalogBranchesUseCase(catalog),
    listCatalogShelves: new ListCatalogShelvesUseCase(catalog),
    listCatalogCopies: new ListCatalogCopiesUseCase(catalog),
    createCatalogTitle: new CreateCatalogTitleUseCase(catalog),
    updateCatalogTitle: new UpdateCatalogTitleUseCase(catalog),
    createCatalogBranch: new CreateCatalogBranchUseCase(catalog),
    createCatalogShelf: new CreateCatalogShelfUseCase(catalog),
    createCatalogCopy: new CreateCopyUseCase(catalog),
    updateCatalogCopy: new UpdateCopyUseCase(catalog),
    listReaderFines: new ListReaderFinesUseCase(billing),
    listReaderPayments: new ListReaderPaymentsUseCase(billing),
    createPayment: new CreatePaymentUseCase(billing),
    simulatePayment: new SimulatePaymentUseCase(billing),
  };
}
