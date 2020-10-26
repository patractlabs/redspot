import { Signale } from "signale";

const log = new Signale({
  logLevel: "warn",
  config: {
    displayLabel: false,
    displayBadge: false,
  },
});

export default log;
