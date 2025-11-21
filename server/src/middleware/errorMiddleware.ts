import { Request, Response, NextFunction } from "express";
import { CustomError } from "../errors";
import STATUS_CODES from "../services/status";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof CustomError)
    return res.status(err.statusCode).json({ error: err.message });

  if (err.message.includes("duplicate key") || err.message.includes("E11000"))
    return res
      .status(STATUS_CODES.CONFLICT)
      .json({ error: "Duplicate entry found" });

  if (err.message.includes("ObjectId") || err.message.includes("BSON"))
    return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ error: "Invalid ID format" });

  return res
    .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
    .json({ error: "Internal Server Error" });
};
