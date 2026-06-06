# TODO

- [ ] Confirm root cause of Maven errors for customer-service POM dependencies missing versions.
- [ ] Implement robust fix by adding explicit versions for missing dependency coordinates in customer-service/pom.xml.
- [ ] Re-run `./mvnw spring-boot:run` for customer-service to verify build passes.
- [x] Added explicit Spring Boot dependency versions in customer-service/pom.xml to resolve missing version errors.

- [ ] If build still fails, inspect effective POM and parent resolution.

