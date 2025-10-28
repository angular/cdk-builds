function _isTestEnvironment() {
  return (typeof __karma__ !== 'undefined' && !!__karma__ || typeof jasmine !== 'undefined' && !!jasmine || typeof jest !== 'undefined' && !!jest || typeof Mocha !== 'undefined' && !!Mocha
  );
}

export { _isTestEnvironment };
//# sourceMappingURL=_test-environment-chunk.mjs.map
