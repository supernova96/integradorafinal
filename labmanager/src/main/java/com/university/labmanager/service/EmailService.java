package com.university.labmanager.service;

import com.university.labmanager.model.Reservation;
import com.university.labmanager.model.User;
import com.university.labmanager.util.QrCodeGenerator;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:noreply@labmanager.com}")
    private String fromEmail;

    // Google Apps Script endpoint built by user
    private static final String APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqnzpEUfRU8ec1F2EGQP7naGen0E0_pGhIZqCVWQF123rNFk1ybnqTPGbanZR_0Kx-/exec";
    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendReservationConfirmation(Reservation reservation, User user) {
        try {
            log.info("📧 [REAL SMTP] Preparing Reservation Confirmation for: {}", user.getEmail());

            // 1. Generate QR Code
            log.info("... Generating QR Code...");
            String qrBase64 = "";
            try {
                String qrContent = "RES-" + reservation.getId();
                byte[] qrImage = QrCodeGenerator.generateQRCodeImage(qrContent, 200, 200);
                qrBase64 = Base64.getEncoder().encodeToString(qrImage);
                log.info("... QR Code Generated successfully (Size: {} bytes)", qrImage.length);
            } catch (Throwable t) {
                log.error("❌ ERROR Generating QR Code: {}", t.getMessage(), t);
                System.out.println("❌ QR GENERATION FAILED: " + t.toString());
                // Fallback: Continue without throwing so the email still sends.
                qrBase64 = "";
            }

            // 2. Prepare Context
            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("reservationId", reservation.getId());
            context.setVariable("laptop", reservation.getLaptop().getModel());
            context.setVariable("startTime",
                    reservation.getStartTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            context.setVariable("endTime",
                    reservation.getEndTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            context.setVariable("qrImage", qrBase64);

            // 3. Process Template
            log.info("... Processing Template 'mail/reservation-confirmation'...");
            String htmlBody = templateEngine.process("mail/reservation-confirmation", context);

            // 4. Send Email
            log.info("... Sending HTML Message...");
            sendHtmlMessage(user.getEmail(), "Confirmación de Reserva - LabManager", htmlBody);

        } catch (Throwable e) {
            log.error("❌ CRITICAL ERROR sending reservation confirmation", e);
            System.out.println("❌ CRITICAL ERROR in sendReservationConfirmation: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendSanctionNotification(User user, String reason) {
        try {
            log.info("📧 [REAL SMTP] Preparing Sanction Notification for: {}", user.getEmail());

            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("reason", reason);

            String htmlBody = templateEngine.process("mail/sanction-notice", context);

            sendHtmlMessage(user.getEmail(), "Aviso de Sanción - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending sanction notification", e);
            System.out.println("❌ CRITICAL ERROR in sendSanctionNotification: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendReminder(Reservation reservation) {
        try {
            User user = reservation.getUser();
            log.info("📧 [REAL SMTP] Preparing Reminder for: {}", user.getEmail());

            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("laptop", reservation.getLaptop().getModel());
            context.setVariable("startTime", reservation.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")));

            String htmlBody = templateEngine.process("mail/reminder", context);

            sendHtmlMessage(user.getEmail(), "Recordatorio de Reserva - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending reminder", e);
            System.out.println("❌ CRITICAL ERROR in sendReminder: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendReturnConfirmation(Reservation reservation, User user) {
        try {
            log.info("📧 [REAL SMTP] Preparing Return Confirmation for: {}", user.getEmail());

            Context context = new Context();
            context.setVariable("name", user.getFullName());
            context.setVariable("laptop", reservation.getLaptop().getModel());
            context.setVariable("returnTime",
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));

            String htmlBody = templateEngine.process("mail/return-confirmation", context);

            sendHtmlMessage(user.getEmail(), "Devolución Exitosa - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending return confirmation", e);
            System.out.println("❌ CRITICAL ERROR in sendReturnConfirmation: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendPasswordResetLink(String to, String token) {
        try {
            log.info("📧 [REAL SMTP] Preparing Password Reset for: {}", to);

            String resetUrl = "https://labmanager-liart.vercel.app/reset-password?token=" + token;

            // Log link for safety/dev
            System.out.println(">>> PASSWORD RESET LINK: " + resetUrl);

            Context context = new Context();
            context.setVariable("resetLink", resetUrl);

            String htmlBody = templateEngine.process("mail/password-reset", context);

            sendHtmlMessage(to, "Recuperación de Contraseña - LabManager", htmlBody);
        } catch (Throwable e) {
            log.error("❌ Error sending password reset link", e);
            System.out.println("❌ CRITICAL ERROR in sendPasswordResetLink: " + e.toString());
            e.printStackTrace();
        }
    }

    @Async
    public void sendSimpleMessage(String to, String subject, String text) {
        log.info("📧 [APP SCRIPT] Attempting to send Simple Email to: {}", to);
        try {
            if (to == null || !to.contains("@")) {
                log.warn("⚠️ Cannot send email, invalid address: {}", to);
                return;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("to", to);
            body.put("subject", subject != null ? subject : "No Subject");
            body.put("htmlBody", text != null ? text.replace("\n", "<br>") : "");

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(APP_SCRIPT_URL, request, String.class);

            log.info("✅ APP SCRIPT Email sent successfully to {}. Response: {}", to, response);
        } catch (Exception e) {
            log.error("❌ APP SCRIPT ERROR sending simple email to {}", to, e);
            e.printStackTrace();
        }
    }

    private void sendHtmlMessage(String to, String subject, String htmlBody) {
        log.info("📧 [APP SCRIPT] Attempting to send HTML Email to: {}", to);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("to", to != null ? to : "");
            body.put("subject", subject != null ? subject : "Notification");
            body.put("htmlBody", htmlBody != null ? htmlBody : "");

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(APP_SCRIPT_URL, request, String.class);

            log.info("✅ APP SCRIPT HTML Email sent successfully to {}. Response: {}", to, response);
        } catch (Exception e) {
            log.error("❌ APP SCRIPT ERROR sending HTML email to {}", to, e);
            e.printStackTrace();
        }
    }
}
