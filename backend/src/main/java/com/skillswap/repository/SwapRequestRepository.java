package com.skillswap.repository;

import com.skillswap.entity.SwapRequest;
import com.skillswap.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {
    List<SwapRequest> findBySenderId(Long senderId);
    List<SwapRequest> findByReceiverId(Long receiverId);
    List<SwapRequest> findBySenderIdAndStatus(Long senderId, RequestStatus status);
    List<SwapRequest> findByReceiverIdAndStatus(Long receiverId, RequestStatus status);
}
