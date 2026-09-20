# Spec Delta

## Purpose

Provides sports complex administrators with business intelligence, calculating financial KPIs (total confirmed revenue, projected revenue, average ticket value), court occupancy rates, and peak hour trends, with support for filtering by date range and exporting records to CSV.

## ADDED Requirements

### Requirement: Financial revenue calculation
The system SHALL aggregate and calculate total revenue from bookings within a selected date range, distinguishing between CONFIRMED revenue and PENDIENTE_PAGO / COMPROBANTE_SUBIDO projected revenue, filtered strictly by the user's `complejoId`.

#### Scenario: Query confirmed revenue for date range
- **WHEN** an ADMIN requests metrics for a specific date interval
- **THEN** the system returns total revenue summing only bookings with status CONFIRMED within that range

#### Scenario: Average ticket calculation
- **WHEN** metrics are requested for a date range with confirmed bookings
- **THEN** the system calculates and returns the average revenue per confirmed booking

### Requirement: Court occupancy rate calculation
The system SHALL compute the court occupancy rate as the percentage of available slots that are in BOOKED status during the selected period, overall and broken down per court.

#### Scenario: Calculate court occupancy
- **WHEN** an ADMIN queries occupancy for court X in date range Y
- **THEN** the system returns the total generated slots, the number of booked slots, and the resulting occupancy percentage

### Requirement: Peak hours analysis
The system SHALL analyze booking frequency across operating hours of the day (e.g. 07:00 to 22:00) and days of the week to identify peak demand times.

#### Scenario: Identify peak hours
- **WHEN** an ADMIN views the hourly distribution report
- **THEN** the system returns the count and percentage of bookings grouped by time slot

### Requirement: Date range filtering
The system SHALL allow filtering metrics and reports by predefined presets ("Hoy", "Últimos 7 días", "Este Mes", "Mes Anterior") as well as arbitrary custom start and end dates.

#### Scenario: Filter by preset
- **WHEN** the user selects the "Este Mes" preset
- **THEN** the system updates all metrics, charts, and tables to reflect bookings within the current calendar month

### Requirement: CSV transaction export
The system SHALL allow administrators to download a CSV file containing all reservation records within the selected date filter, including booking ID, date, court name, customer name, customer phone, total amount, status, and payment timestamp.

#### Scenario: Download CSV report
- **WHEN** an ADMIN clicks the "Exportar a CSV" button
- **THEN** the system generates and downloads a valid RFC 4180 CSV file containing the filtered booking records
