package com.university.labmanager.dto;

import com.university.labmanager.model.Incident;
import com.university.labmanager.model.Reservation;
import lombok.Data;

import java.util.List;

@Data
public class LaptopHistoryDTO {
    private List<Reservation> pastReservations;
    private List<Incident> incidents;
    private Double averageRating;
}
