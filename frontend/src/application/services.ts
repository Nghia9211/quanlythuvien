import type { SessionStore } from "./ports/auth.gateway";
import type { LoginUseCase, LogoutUseCase, RestoreSessionUseCase } from "./use-cases/auth.use-cases";
import type {
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
} from "./use-cases/library.use-cases";

export interface AppServices {
  sessions: SessionStore;
  login: Pick<LoginUseCase, "execute">;
  restoreSession: Pick<RestoreSessionUseCase, "execute">;
  logout: Pick<LogoutUseCase, "execute">;
  getOperationalReport: Pick<GetOperationalReportUseCase, "execute">;
  registerReader: Pick<RegisterReaderUseCase, "execute">;
  getReader: Pick<GetReaderUseCase, "execute">;
  updateReader: Pick<UpdateReaderUseCase, "execute">;
  renewReaderCard: Pick<RenewReaderCardUseCase, "execute">;
  changeCardStatus: Pick<ChangeCardStatusUseCase, "execute">;
  borrowBooks: Pick<BorrowBooksUseCase, "execute">;
  returnBooks: Pick<ReturnBooksUseCase, "execute">;
  listReaderLoans: Pick<ListReaderLoansUseCase, "execute">;
  listReservations: Pick<ListReservationsUseCase, "execute">;
  cancelReservation: Pick<CancelReservationUseCase, "execute">;
  allocateReservation: Pick<AllocateReservationUseCase, "execute">;
}
