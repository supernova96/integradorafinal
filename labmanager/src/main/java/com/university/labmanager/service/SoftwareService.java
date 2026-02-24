package com.university.labmanager.service;

import com.university.labmanager.model.Software;
import com.university.labmanager.repository.SoftwareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SoftwareService {

    @Autowired
    private SoftwareRepository softwareRepository;

    public List<Software> getAllSoftware() {
        return softwareRepository.findAll();
    }

    public Software getSoftwareById(Long id) {
        return softwareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Software no encontrado con ID: " + id));
    }

    public Software saveSoftware(Software software) {
        Optional<Software> existing = softwareRepository.findByName(software.getName());
        if (existing.isPresent() && !existing.get().getId().equals(software.getId())) {
            throw new RuntimeException("El software con este nombre ya existe en el catálogo.");
        }
        return softwareRepository.save(software);
    }

    public void deleteSoftware(Long id) {
        if (!softwareRepository.existsById(id)) {
            throw new RuntimeException("Software no encontrado con ID: " + id);
        }
        softwareRepository.deleteById(id);
    }
}
