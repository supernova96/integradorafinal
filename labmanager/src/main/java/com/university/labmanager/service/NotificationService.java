package com.university.labmanager.service;

import com.university.labmanager.model.Notification;
import com.university.labmanager.model.User;
import com.university.labmanager.repository.NotificationRepository;
import com.university.labmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.university.labmanager.model.enums.Role;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Creates and saves a notification for a specific user, and pushes it via
     * WebSocket.
     */
    @Transactional
    public Notification createNotification(Long userId, String message, String type) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return null; // or throw Exception
        }

        Notification notification = new Notification();
        notification.setUser(userOpt.get());
        notification.setMessage(message);
        notification.setType(type);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);

        notification = notificationRepository.save(notification);

        // Send via WebSocket (so real-time clients instantly show toast/update badge)
        messagingTemplate.convertAndSendToUser(
                userOpt.get().getMatricula(),
                "/queue/notifications",
                message);

        return notification;
    }

    /**
     * Broadcast a notification to all ADMIN users.
     */
    @Transactional
    public void notifyAdmins(String message, String type) {
        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
        for (User admin : admins) {
            createNotification(admin.getId(), message, type);
        }
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Optional<Notification> notifOpt = notificationRepository.findById(notificationId);
        if (notifOpt.isPresent()) {
            Notification notif = notifOpt.get();
            // ensure it belongs to the user
            if (notif.getUser().getId().equals(userId)) {
                notif.setRead(true);
                notificationRepository.save(notif);
            }
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }
}
