# E-Commerce Backend

Spring Boot 3.4 + Java 25 REST API for a full-stack e-commerce application.

## Package Structure

- **controller** — Receives HTTP requests and maps them to service methods. Contains `@RestController` classes that define the API endpoints.
- **service** — Contains business logic classes annotated with `@Service`. Controllers delegate to services, which in turn call repository interfaces.
- **repository** — Contains Spring Data JPA repository interfaces that provide CRUD and custom database query methods for each entity.
- **model** — Contains JPA entity classes (`@Entity`) that map directly to database tables.
- **model.enums** — Contains Java enums (`UserRole`, `OrderStatus`, etc.) that correspond to PostgreSQL ENUM column types used by the entities.
- **dto** — Contains Data Transfer Objects that shape request and response payloads, keeping the API contract independent from the internal entity structure.
- **security** — Contains JWT token filter, authentication utilities, and the custom `UserDetailsService` integration with Spring Security.
- **config** — Contains Spring `@Configuration` classes such as `SecurityConfig`, `CorsConfig`, and `CloudinaryConfig` for bean wiring and framework setup.
- **exception** — Contains custom exception classes and a global `@ControllerAdvice` error handler that returns consistent JSON error responses.

## Database

- Database: `ecommerce_db`
- User: `ecom_user`
- Port: `5432`
- Password is set via the `DB_PASSWORD` environment variable.

## How to Run

```bash
mvn spring-boot:run
```
