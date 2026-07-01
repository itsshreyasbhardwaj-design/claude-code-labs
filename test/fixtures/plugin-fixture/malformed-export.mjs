export default {
  id: "bad-plugin",
  // Missing `scan` — should be rejected by the duck-type check, not crash the loader.
};
