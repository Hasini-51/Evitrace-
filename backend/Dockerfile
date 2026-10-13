# ==========================================
# EviTrace Backend - Multi-stage Dockerfile
# ==========================================

# Stage 1: Build application with Maven
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -B clean package -DskipTests

# Stage 2: Runtime environment with JRE 17
FROM eclipse-temurin:17-jre
WORKDIR /app

# Create directories for persistent file storage & database
RUN mkdir -p /app/uploads /app/data

COPY --from=build /app/target/evitrace-backend-1.0.0.jar app.jar

ENV PORT=8080 \
    FILE_UPLOAD_DIR=/app/uploads

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
