package com.university.labmanager.controller;

import com.university.labmanager.model.Notification;
import com.university.labmanager.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.university.labmanager.security.UserDetailsImpl;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*") // Allows cross-origin requests
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            return userDetails.getId();
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications() {
        Long userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Long userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        Long userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }
}
