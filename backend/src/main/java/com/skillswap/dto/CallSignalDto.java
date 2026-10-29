package com.skillswap.dto;

import com.skillswap.enums.CallSignalType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallSignalDto {

    private Long matchId;
    private Long fromUserId;
    private Long toUserId;

    private CallSignalType type;

    // SDP payload for OFFER / ANSWER
    private String sdp;

    // ICE payload
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;

    // Optional metadata
    private Boolean videoEnabled;
    private String message;
}