package com.skillswap.config;

import com.skillswap.entity.Skill;
import com.skillswap.entity.User;
import com.skillswap.enums.Role;
import com.skillswap.enums.AccountStatus;
import com.skillswap.repository.SkillRepository;
import com.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAIL:admin@skillswap.com}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(adminEmail).isEmpty() && !adminPassword.isBlank()) {
            User admin = User.builder()
                    .fullName("Admin User")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .emailVerified(true)
                    .ratingAvg(0.0)
                    .totalReviews(0)
                    .build();

            userRepository.save(admin);
            log.info("Initial admin user created: {}", adminEmail);
        } else if (userRepository.findByEmail(adminEmail).isEmpty()) {
            log.warn("ADMIN_PASSWORD is not set; skipping initial admin creation");
        }

        if (skillRepository.count() > 0) {
            return;
        }

        skillRepository.save(Skill.builder().name("Java").category("Programming").description("Core Java programming").isActive(true).build());
        skillRepository.save(Skill.builder().name("Python").category("Programming").description("Python programming").isActive(true).build());
        skillRepository.save(Skill.builder().name("JavaScript").category("Programming").description("JavaScript / Node.js").isActive(true).build());
        skillRepository.save(Skill.builder().name("React").category("Programming").description("React.js frontend framework").isActive(true).build());
        skillRepository.save(Skill.builder().name("Spring Boot").category("Programming").description("Spring Boot framework").isActive(true).build());
        skillRepository.save(Skill.builder().name("Database Design").category("Programming").description("SQL and database design").isActive(true).build());
        skillRepository.save(Skill.builder().name("DSA").category("Programming").description("Data Structures & Algorithms").isActive(true).build());
        skillRepository.save(Skill.builder().name("UI/UX Design").category("Design").description("User interface and experience design").isActive(true).build());
        skillRepository.save(Skill.builder().name("Graphic Design").category("Design").description("Graphic and visual design").isActive(true).build());
        skillRepository.save(Skill.builder().name("Figma").category("Design").description("Figma design tool").isActive(true).build());
        skillRepository.save(Skill.builder().name("English Speaking").category("Language").description("Spoken English").isActive(true).build());
        skillRepository.save(Skill.builder().name("Hindi").category("Language").description("Hindi language").isActive(true).build());
        skillRepository.save(Skill.builder().name("Spanish").category("Language").description("Spanish language").isActive(true).build());
        skillRepository.save(Skill.builder().name("Resume Review").category("Professional").description("Resume writing and review").isActive(true).build());
        skillRepository.save(Skill.builder().name("Interview Prep").category("Professional").description("Interview preparation").isActive(true).build());
        skillRepository.save(Skill.builder().name("Communication").category("Professional").description("Professional communication").isActive(true).build());
        skillRepository.save(Skill.builder().name("Photography").category("Hobby").description("Photography techniques").isActive(true).build());
        skillRepository.save(Skill.builder().name("Music").category("Hobby").description("Music and instruments").isActive(true).build());
        skillRepository.save(Skill.builder().name("Fitness").category("Hobby").description("Fitness and exercise").isActive(true).build());

        log.info("Default skills initialized successfully");
    }
}
/*
 * @Component
 * 
 * @RequiredArgsConstructor public class DataInitializer implements
 * CommandLineRunner { private final SkillRepository skillRepository; private
 * final UserRepository userRepository; private final PasswordEncoder
 * passwordEncoder;
 * 
 * @Override public void run(String... args) throws Exception { // Initialize
 * Admin User if (userRepository.findByEmail("admin@skillswap.com").isEmpty()) {
 * User admin = User.builder() .fullName("Admin User")
 * .email("admin@skillswap.com")
 * .passwordHash(passwordEncoder.encode("admin123")) .role(Role.ADMIN)
 * .ratingAvg(0.0) .totalReviews(0) .build(); userRepository.save(admin);
 * System.out.println("✓ Admin user created: admin@skillswap.com / admin123"); }
 * 
 * if (skillRepository.count() > 0) return; // Skills already initialized
 * 
 * // Programming Skills
 * skillRepository.save(Skill.builder().name("Java").category("Programming").
 * description("Core Java programming").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Python").category("Programming").
 * description("Python programming").isActive(true).build());
 * skillRepository.save(Skill.builder().name("JavaScript").category(
 * "Programming").description("JavaScript & Node.js").isActive(true).build());
 * skillRepository.save(Skill.builder().name("React").category("Programming").
 * description("React.js frontend framework").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Spring Boot").category(
 * "Programming").description("Spring Boot framework").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Database Design").category(
 * "Programming").description("SQL and database design").isActive(true).build())
 * ; skillRepository.save(Skill.builder().name("DSA").category("Programming").
 * description("Data Structures & Algorithms").isActive(true).build());
 * 
 * // Design Skills
 * skillRepository.save(Skill.builder().name("UI/UX Design").category("Design").
 * description("User interface and experience design").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Graphic Design").category("Design"
 * ).description("Graphic and visual design").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Figma").category("Design").
 * description("Figma design tool").isActive(true).build());
 * 
 * // Language Skills
 * skillRepository.save(Skill.builder().name("English Speaking").category(
 * "Language").description("Spoken English").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Hindi").category("Language").
 * description("Hindi language").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Spanish").category("Language").
 * description("Spanish language").isActive(true).build());
 * 
 * // Professional Skills
 * skillRepository.save(Skill.builder().name("Resume Review").category(
 * "Professional").description("Resume writing and review").isActive(true).build
 * ()); skillRepository.save(Skill.builder().name("Interview Prep").category(
 * "Professional").description("Interview preparation").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Communication").category(
 * "Professional").description("Professional communication").isActive(true).
 * build());
 * 
 * // Other Skills
 * skillRepository.save(Skill.builder().name("Photography").category("Hobby").
 * description("Photography techniques").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Music").category("Hobby").
 * description("Music and instruments").isActive(true).build());
 * skillRepository.save(Skill.builder().name("Fitness").category("Hobby").
 * description("Fitness and exercise").isActive(true).build());
 * 
 * System.out.println("✓ Skills initialized successfully"); } }
 */
