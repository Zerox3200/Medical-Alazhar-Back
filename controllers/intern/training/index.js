// Cases Imports
import {
  getAllCases,
  addCase,
  getSingleCase,
  editCase,
  deleteCase,
} from "./intern.cases.controller.js";

// Procedures Imports
import {
  getAllProcedures,
  getSingleProcedure,
  addProcedure,
  editProcedure,
  deleteProcedure,
} from "./intern.procedures.controller.js";

// Self Learning Activitiy Imports
import {
  getAllSelfLearningActivities,
  getSingleSelfLearningActivity,
  addSelfLearningActivity,
  editSelfLearningActivity,
  deleteSelfLearningActivity,
} from "./intern.selflearning.controller.js";

// Direct Learning Activitiy Imports
import {
  getAllDirectLearningActivities,
  getSingleDirectLearningActivity,
  addDirectLearningActivity,
  editDirectLearningActivity,
  deleteDirectLearningActivity,
} from "./intern.directlearning.controller.js";

const internTrainingController = {
  cases: { getAllCases, addCase, getSingleCase, editCase, deleteCase },
  procedures: {
    getAllProcedures,
    getSingleProcedure,
    addProcedure,
    editProcedure,
    deleteProcedure,
  },
  selfLearning: {
    getAllSelfLearningActivities,
    getSingleSelfLearningActivity,
    addSelfLearningActivity,
    editSelfLearningActivity,
    deleteSelfLearningActivity,
  },
  directLearning: {
    getAllDirectLearningActivities,
    getSingleDirectLearningActivity,
    addDirectLearningActivity,
    editDirectLearningActivity,
    deleteDirectLearningActivity,
  },
};

export default internTrainingController;
