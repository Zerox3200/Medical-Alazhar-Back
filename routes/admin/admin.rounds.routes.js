import express from "express";

import {
  createRound,
  insertWave,
  assignCoordinator,
  assignIntern,
  assignSupervisor,
  dropRound,
  getAllRounds,
  getRound,
} from "../../controllers/admin/admin.rounds.controller.js";

import {
  roundValidation,
  waveValidation,
} from "../../validation/round/round.validation.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import isAdmin from "../../middlewares/isAdmin.js";
import validate from "../../validation/validate.js";
import checkRole from "../../middlewares/checkRole.js";

const roundsRouter = express.Router({ mergeParams: true });

// create round
roundsRouter.post(
  "/create",
  isAuthenticated,
  isAdmin,
  validate(roundValidation),
  createRound
);

// insert wave
roundsRouter.post(
  "/:roundId/waves/insert",
  isAuthenticated,
  checkRole("admin", "coordinator", "supervisor"),
  validate(waveValidation),
  insertWave
);

/**************************************************/
// GET all rounds
roundsRouter.get("/", isAuthenticated, isAdmin, getAllRounds);

// GET round
roundsRouter.get("/:roundId", isAuthenticated, isAdmin, getRound);

// DELETE round
roundsRouter.delete("/:roundId", isAuthenticated, isAdmin, dropRound);

// PATCH assign supervisor
roundsRouter.patch(
  "/:roundId/supervisors/assign",
  isAuthenticated,
  isAdmin,
  assignSupervisor
);

// PATCH assign coordinator
roundsRouter.patch(
  "/:roundId/coordinator/assign",
  isAuthenticated,
  isAdmin,
  assignCoordinator
);

// PATCH assign intern
roundsRouter.patch(
  "/:roundId/interns/assign",
  isAuthenticated,
  checkRole(["admin", "coordinator"]),
  assignIntern
);

export default roundsRouter;
