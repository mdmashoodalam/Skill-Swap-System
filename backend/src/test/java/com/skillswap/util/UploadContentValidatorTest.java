package com.skillswap.util;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class UploadContentValidatorTest {

    @Test
    void acceptsMatchingImageSignaturesAndRejectsMimeTypeSpoofing() {
        byte[] pngHeader = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

        assertThat(UploadContentValidator.isSupportedImage("image/png", pngHeader)).isTrue();
        assertThat(UploadContentValidator.isSupportedImage("image/jpeg", pngHeader)).isFalse();
        assertThat(UploadContentValidator.isSupportedImage("image/png", "not an image".getBytes(StandardCharsets.UTF_8)))
                .isFalse();
    }

    @Test
    void validatesPdfAndUtf8TextAttachments() {
        assertThat(UploadContentValidator.isSupportedAttachment("application/pdf", "%PDF-1.7".getBytes(StandardCharsets.UTF_8)))
                .isTrue();
        assertThat(UploadContentValidator.isSupportedAttachment("text/plain", "Hello\nworld".getBytes(StandardCharsets.UTF_8)))
                .isTrue();
        assertThat(UploadContentValidator.isSupportedAttachment("text/plain", new byte[]{0, 1, 2}))
                .isFalse();
    }

    @Test
    void normalizesMimeTypeParameters() {
        assertThat(UploadContentValidator.normalizeMediaType(" Text/Plain; charset=UTF-8 ")).isEqualTo("text/plain");
    }
}
