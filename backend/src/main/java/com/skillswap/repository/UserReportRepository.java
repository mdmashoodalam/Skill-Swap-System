package com.skillswap.repository;
import com.skillswap.entity.UserReport;
import com.skillswap.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    List<UserReport> findAllByOrderByCreatedAtDesc();
    List<UserReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);
}
