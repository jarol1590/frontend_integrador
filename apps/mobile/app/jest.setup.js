// jest.setup.js
jest.mock('@testing-library/react-native/src/helpers/ensure-peer-deps', () => ({
  ensurePeerDeps: () => {},
}));
