package com.university.labmanager.repository;
// Trigger compilation

import com.university.labmanager.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Get all notifications for a specific user, ordered by newest first
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Count how many unread notifications the user has
    long countByUserIdAndIsReadFalse(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId")
    void markAllAsReadByUserId(Long userId);
}
