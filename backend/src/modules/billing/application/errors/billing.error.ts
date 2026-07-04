export class BillingError extends Error { constructor(message:string){super(message);this.name="BillingError";} }
export class BillingNotFoundError extends BillingError { constructor(message:string){super(message);this.name="BillingNotFoundError";} }
