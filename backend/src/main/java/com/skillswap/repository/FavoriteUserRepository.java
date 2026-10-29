package com.skillswap.repository;
import com.skillswap.entity.FavoriteUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface FavoriteUserRepository extends JpaRepository<FavoriteUser, Long> {
    List<FavoriteUser> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<FavoriteUser> findByOwnerIdAndFavoriteUserId(Long ownerId, Long favoriteUserId);
}
