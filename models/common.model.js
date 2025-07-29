import Admin from "./admin/admin.model.js";
import Supervisor from "./supervisor/supervisor.models.js";
import Intern from "./intern/Intern.models.js";

const validateUniqueEmailAndPhone = async (email, phone, currentModel) => {
  const models = [Admin, Supervisor, Intern].filter((m) => m !== currentModel);
  const results = await Promise.all([
    ...models.map((Model) => Model.exists({ email })),
    ...models.map((Model) => Model.exists({ phone })),
  ]);

  const emailExists = results.slice(0, models.length).some(Boolean);
  const phoneExists = results.slice(models.length).some(Boolean);

  const errors = [];
  if (emailExists) errors.push("Email already exists");
  if (phoneExists) errors.push("Phone already exists");

  if (errors.length > 0) {
    throw new Error(errors.join(" and "));
  }
};

export default validateUniqueEmailAndPhone;
