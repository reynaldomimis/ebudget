const MOOERepository = require("../repositories/MOOERepository");
const PSRepository = require("../repositories/PSRepository");

class SourceResolver {
  static resolveDataSource(source) {
    if (source === "PS") {
      return "ps";
    } else if (source === "MOOE") {
      return "mooe";
    }
    return "mooe";
  }

  static resolveRepository(source) {
    if (source === "PS") {
      return PSRepository;
    } else if (source === "MOOE") {
      return MOOERepository;
    }
    return MOOERepository;
  }
}

module.exports = SourceResolver;
