package com.university.labmanager.controller;

import com.university.labmanager.model.Software;
import com.university.labmanager.service.SoftwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/software")
public class SoftwareController {

    @Autowired
    private SoftwareService softwareService;

    @GetMapping
    public ResponseEntity<List<Software>> getAllSoftware() {
        return ResponseEntity.ok(softwareService.getAllSoftware());
    }

    @PostMapping
    public ResponseEntity<Software> createSoftware(@RequestBody Software software) {
        return ResponseEntity.ok(softwareService.saveSoftware(software));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Software> updateSoftware(@PathVariable Long id, @RequestBody Software software) {
        software.setId(id);
        return ResponseEntity.ok(softwareService.saveSoftware(software));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSoftware(@PathVariable Long id) {
        softwareService.deleteSoftware(id);
        return ResponseEntity.ok().build();
    }
}
