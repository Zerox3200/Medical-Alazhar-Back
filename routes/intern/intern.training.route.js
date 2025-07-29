import express from "express";

import internTrainingController from "../../controllers/intern/training/index.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import checkRole from "../../middlewares/checkRole.js";
import multerConfig from "../../services/multerConfig.js";

const internTrainingRoutes = express.Router({ mergeParams: true });

/**********************************CASES**********************************/

// Fetch all cases
internTrainingRoutes.get(
  "/cases",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.cases.getAllCases
);

// Fetch single case
internTrainingRoutes.get(
  "/cases/:caseId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.cases.getSingleCase
);

// Insert new case
internTrainingRoutes.post(
  "/cases/add",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.cases.addCase
);

// Edit not accepted cases
internTrainingRoutes.patch(
  "/cases/:caseId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.cases.editCase
);

// Delete not accepted case
internTrainingRoutes.delete(
  "/cases/:caseId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.cases.deleteCase
);

/******************************** PROCEDURES ********************************/
// Fetch all procedures
internTrainingRoutes.get(
  "/procedures/",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.procedures.getAllProcedures
);

// Fetch single procedure
internTrainingRoutes.get(
  "/procedures/:procedureId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.procedures.getSingleProcedure
);

// Insert new procedure
internTrainingRoutes.post(
  "/procedures/add",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.procedures.addProcedure
);

// Edit not accepted procedures
internTrainingRoutes.patch(
  "/procedures/:procedureId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.procedures.editProcedure
);

// Delete not accepted procedures
internTrainingRoutes.delete(
  "/procedures/:procedureId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.procedures.deleteProcedure
);

/***************************SELF_LEARNING_ACTIVITIES***************************/
// Fetch all self learning activities
internTrainingRoutes.get(
  "/self-learning-activities/",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.selfLearning.getAllSelfLearningActivities
);

// Fetch single self learning activity
internTrainingRoutes.get(
  "/self-learning-activities/:activityId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.selfLearning.getSingleSelfLearningActivity
);

// Insert new self learning activity
internTrainingRoutes.post(
  "/self-learning-activities/add",
  isAuthenticated,
  checkRole(["intern"]),
  multerConfig.single("selfLearningActivityEvidence"),
  internTrainingController.selfLearning.addSelfLearningActivity
);

// Edit not accepted self learning activity
internTrainingRoutes.patch(
  "/self-learning-activities/:activityId",
  isAuthenticated,
  checkRole(["intern"]),
  multerConfig.single("selfLearningActivityEvidence"),
  internTrainingController.selfLearning.editSelfLearningActivity
);

// Delete not accepted self learning activity
internTrainingRoutes.delete(
  "/self-learning-activities/:activityId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.selfLearning.deleteSelfLearningActivity
);

/**************************DIRECT_LEARNING_ACTIVITIES**************************/
// Fetch all direct learning activitiy
internTrainingRoutes.get(
  "/direct-learning-activities/",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.directLearning.getAllDirectLearningActivities
);

// Fetch single direct learning activity
internTrainingRoutes.get(
  "/direct-learning-activities/:activityId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.directLearning.getSingleDirectLearningActivity
);

// Insert new direct learning activity
internTrainingRoutes.post(
  "/direct-learning-activities/add",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.directLearning.addDirectLearningActivity
);

// Edit not accepted direct learning activity
internTrainingRoutes.patch(
  "/direct-learning-activities/:activityId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.directLearning.editDirectLearningActivity
);

// Delete not accepted direct learning activity
internTrainingRoutes.delete(
  "/direct-learning-activities/:activityId",
  isAuthenticated,
  checkRole(["intern"]),
  internTrainingController.directLearning.deleteDirectLearningActivity
);

export default internTrainingRoutes;
