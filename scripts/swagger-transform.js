const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const yaml = require("js-yaml");

module.exports = (inputSchema) => {
  const argv = process.argv.slice(2);
  const config = argv[0];

  if (config) {
    const overridesFile = path.join("src/services", config, "overrides.yaml");
    const transformFile = path.join("src/services", config, "transform.js");

    if (fs.existsSync(overridesFile)) {
      const data = fs.readFileSync(overridesFile, "utf8");
      const { allowpaths, operationIdOverrides } = yaml.load(data);

      const paths = allowpaths.includes("*")
        ? inputSchema.paths
        : _.pick(inputSchema.paths, ...allowpaths);

      _.forIn(operationIdOverrides, (value, key) => {
        const [path, method] = key.split(".");

        if (
          path &&
          method &&
          _.has(paths, path) &&
          _.has(paths[path], method)
        ) {
          _.set(paths, [path, method, "operationId"], value);
        }
      });

      if (fs.existsSync(transformFile)) {
        const transform = require(path.resolve(process.cwd(), transformFile));

        return transform({
          ...inputSchema,
          paths,
        });
      }

      return {
        ...inputSchema,
        paths,
      };
    }
  }

  return inputSchema;
};
