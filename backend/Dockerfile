FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 skillswap && mkdir -p /app/uploads && chown -R skillswap /app
COPY --from=build /workspace/target/backend-*.jar app.jar
USER skillswap
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
