const caseInsensitiveFilters = (filters, Model) =>
  Object.fromEntries(
    Object.entries(filters).map(([key, value]) => {
      const fieldType = Model.schema.paths[key]?.instance;
      if (typeof value === "string" && fieldType === "String") {
        return [key, { $regex: new RegExp(value, "i") }];
      }
      if (
        fieldType === "Number" &&
        typeof value === "string" &&
        !isNaN(value)
      ) {
        return [key, Number(value)];
      }
      return [key, value];
    })
  );

export default caseInsensitiveFilters;
