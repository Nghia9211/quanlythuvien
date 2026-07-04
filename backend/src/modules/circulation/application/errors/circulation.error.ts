export { CirculationDomainError } from "../../domain/errors/circulation-domain.error";
export class CirculationError extends Error { constructor(message: string) { super(message); this.name = "CirculationError"; } }
export class CirculationNotFoundError extends CirculationError {}
