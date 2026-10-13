package com.evitrace.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
@Slf4j
public class StorageService {

    @Value("${app.file.upload-dir:./uploads}")
    private String baseUploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(baseUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Initialized file storage root directory at: {}", this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    public String store(MultipartFile file, Long caseId) throws IOException {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed_evidence");

        // Disallow path traversal
        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("Cannot store file with relative path outside current directory: " + originalFilename);
        }

        // Case directory: ./uploads/cases/{caseId}
        Path caseDir = this.rootLocation.resolve("cases").resolve(String.valueOf(caseId));
        Files.createDirectories(caseDir);

        // Append UUID to avoid filename collisions while preserving original extension
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        String safeStoredName = UUID.randomUUID().toString() + "_" + originalFilename;

        Path targetLocation = caseDir.resolve(safeStoredName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        log.info("Stored file '{}' at '{}'", originalFilename, targetLocation);
        return targetLocation.toString();
    }

    public Resource loadAsResource(String storagePath) throws FileNotFoundException {
        try {
            Path filePath = Paths.get(storagePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileNotFoundException("File not found or not readable at: " + storagePath);
            }
        } catch (MalformedURLException e) {
            throw new FileNotFoundException("Invalid file path: " + storagePath);
        }
    }

    public boolean delete(String storagePath) {
        try {
            Path filePath = Paths.get(storagePath).normalize();
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file at: {}", storagePath, e);
            return false;
        }
    }
}
