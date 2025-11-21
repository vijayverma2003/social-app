import STATUS_CODES from "./services/status";

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, STATUS_CODES.BAD_REQUEST);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Unauthorized") {
    super(message, STATUS_CODES.UNAUTHORIZED);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message, STATUS_CODES.FORBIDDEN);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message, STATUS_CODES.NOT_FOUND);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, STATUS_CODES.CONFLICT);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "Internal Server Error") {
    super(message, STATUS_CODES.INTERNAL_SERVER_ERROR);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
