# TODO

## Config server / discovery server health + config fetch
- [x] Fix config-server repository DOWN: Git clone/checkout failure (NoSuchRepositoryException).

- [ ] Ensure config-server can serve endpoints: /{application}/{profile} and actuator /actuator/health.
- [ ] Align discovery-server and other services to fetch from config-server successfully.
- [ ] Add/verify working Git settings for config-server (URI, label/branch, search paths).
- [ ] Test:
  - [ ] http://localhost:8888/actuator/health returns UP
  - [ ] http://localhost:8888/discovery-server/default returns config JSON/properties
  - [ ] start discovery-server and verify it initializes (no UNKNOWN discovery client)

