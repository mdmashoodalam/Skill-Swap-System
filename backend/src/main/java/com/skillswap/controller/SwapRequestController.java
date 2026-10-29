package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.enums.RequestStatus;
import com.skillswap.service.SwapRequestService;
import com.skillswap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/swap-requests")
@RequiredArgsConstructor
public class SwapRequestController {

    private final SwapRequestService service;
    private final UserService userService;

    @PostMapping
    public Object createFromMe(@Valid @RequestBody CommonDtos.SwapRequestCreateRequest request) {
        Long senderId = getAuthenticatedUserId();
        return service.create(request, senderId);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public Object getAll() {
        return service.getAll();
    }

    @GetMapping("/incoming/me")
    public Object incomingForMe() {
        return service.incoming(getAuthenticatedUserId());
    }

    @GetMapping("/outgoing/me")
    public Object outgoingForMe() {
        return service.outgoing(getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/accept")
    public Object accept(@PathVariable Long id) {
        return service.updateStatus(id, RequestStatus.ACCEPTED, getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/reject")
    public Object reject(@PathVariable Long id) {
        return service.updateStatus(id, RequestStatus.REJECTED, getAuthenticatedUserId());
    }

    @PatchMapping("/{id}/cancel")
    public Object cancel(@PathVariable Long id) {
        return service.updateStatus(id, RequestStatus.CANCELLED, getAuthenticatedUserId());
    }

    @PutMapping("/{id}")
    public Object updateStatus(@PathVariable Long id, @Valid @RequestBody CommonDtos.StatusUpdateRequest request) {
        RequestStatus status = RequestStatus.valueOf(request.getStatus().toUpperCase());
        return service.updateStatus(id, status, getAuthenticatedUserId());
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByEmail(auth.getName()).getId();
    }
}

/*
 * package com.skillswap.controller;
 * 
 * import com.skillswap.dto.CommonDtos; import
 * com.skillswap.enums.RequestStatus; import
 * com.skillswap.service.SwapRequestService; import
 * com.skillswap.service.UserService; import jakarta.validation.Valid; import
 * lombok.RequiredArgsConstructor; import
 * org.springframework.security.core.Authentication; import
 * org.springframework.security.core.context.SecurityContextHolder; import
 * org.springframework.web.bind.annotation.*;
 * 
 * @RestController
 * 
 * @RequestMapping("/api/swap-requests")
 * 
 * @RequiredArgsConstructor public class SwapRequestController { private final
 * SwapRequestService service; private final UserService userService;
 * 
 * @PostMapping public Object createFromMe(@Valid @RequestBody
 * CommonDtos.SwapRequestCreateRequest request) { Authentication auth =
 * SecurityContextHolder.getContext().getAuthentication(); String email =
 * auth.getName(); Long senderId = userService.getUserByEmail(email).getId();
 * try { return service.create(request, senderId); } catch
 * (IllegalArgumentException ex) { return
 * org.springframework.http.ResponseEntity.badRequest().body(ex.getMessage()); }
 * }
 * 
 * @GetMapping("/all") public Object getAll() { return service.getAll(); }
 * 
 * // Deprecated: use /api/swap-requests (POST) with auth
 * 
 * @PostMapping("/{senderId}") public Object create(@PathVariable Long
 * senderId, @Valid @RequestBody CommonDtos.SwapRequestCreateRequest request) {
 * try { return service.create(request, senderId); } catch
 * (IllegalArgumentException ex) { return
 * org.springframework.http.ResponseEntity.badRequest().body(ex.getMessage()); }
 * }
 * 
 * // Deprecated: use /api/swap-requests (POST) with auth
 * 
 * @PostMapping("/me") public Object createFromMeAlt(@Valid @RequestBody
 * CommonDtos.SwapRequestCreateRequest request) { Authentication auth =
 * SecurityContextHolder.getContext().getAuthentication(); String email =
 * auth.getName(); Long senderId = userService.getUserByEmail(email).getId();
 * try { return service.create(request, senderId); } catch
 * (IllegalArgumentException ex) { return
 * org.springframework.http.ResponseEntity.badRequest().body(ex.getMessage()); }
 * }
 * 
 * @GetMapping("/incoming/{userId}") public Object incoming(@PathVariable Long
 * userId) { return service.incoming(userId); }
 * 
 * @GetMapping("/incoming/me") public Object incomingForMe() { Authentication
 * auth = SecurityContextHolder.getContext().getAuthentication(); String email =
 * auth.getName(); Long userId = userService.getUserByEmail(email).getId();
 * return service.incoming(userId); }
 * 
 * @GetMapping("/outgoing/{userId}") public Object outgoing(@PathVariable Long
 * userId) { return service.outgoing(userId); }
 * 
 * @GetMapping("/outgoing/me") public Object outgoingForMe() { Authentication
 * auth = SecurityContextHolder.getContext().getAuthentication(); String email =
 * auth.getName(); Long userId = userService.getUserByEmail(email).getId();
 * return service.outgoing(userId); }
 * 
 * @PatchMapping("/{id}/accept") public Object accept(@PathVariable Long id) {
 * return service.updateStatus(id, RequestStatus.ACCEPTED); }
 * 
 * @PatchMapping("/{id}/reject") public Object reject(@PathVariable Long id) {
 * return service.updateStatus(id, RequestStatus.REJECTED); }
 * 
 * @PatchMapping("/{id}/cancel") public Object cancel(@PathVariable Long id) {
 * return service.updateStatus(id, RequestStatus.CANCELLED); }
 * 
 * @PutMapping("/{id}") public Object updateStatus(@PathVariable Long
 * id, @Valid @RequestBody CommonDtos.StatusUpdateRequest request) {
 * RequestStatus status =
 * RequestStatus.valueOf(request.getStatus().toUpperCase()); return
 * service.updateStatus(id, status); } }
 */