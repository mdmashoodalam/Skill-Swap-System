package com.skillswap.util;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

public final class UploadContentValidator {

    private UploadContentValidator() {}

    public static String normalizeMediaType(String contentType) {
        if (contentType == null) return "";
        int parameterStart = contentType.indexOf(';');
        String mediaType = parameterStart >= 0 ? contentType.substring(0, parameterStart) : contentType;
        return mediaType.trim().toLowerCase();
    }

    public static boolean isSupportedImage(String mediaType, byte[] bytes) {
        if (bytes == null) return false;
        return switch (normalizeMediaType(mediaType)) {
            case "image/jpeg" -> startsWith(bytes, 0xFF, 0xD8, 0xFF);
            case "image/png" -> startsWith(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "image/webp" -> bytes.length >= 12
                    && asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP");
            default -> false;
        };
    }

    public static boolean isSupportedAttachment(String mediaType, byte[] bytes) {
        return switch (normalizeMediaType(mediaType)) {
            case "image/jpeg", "image/png", "image/webp" -> isSupportedImage(mediaType, bytes);
            case "application/pdf" -> startsWith(bytes, 0x25, 0x50, 0x44, 0x46, 0x2D);
            case "text/plain" -> isPlainText(bytes);
            default -> false;
        };
    }

    private static boolean isPlainText(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return false;
        try {
            var decoded = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes));
            while (decoded.hasRemaining()) {
                char character = decoded.get();
                if (Character.isISOControl(character) && character != '\n' && character != '\r' && character != '\t') {
                    return false;
                }
            }
            return true;
        } catch (CharacterCodingException exception) {
            return false;
        }
    }

    private static boolean startsWith(byte[] bytes, int... signature) {
        if (bytes == null || bytes.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((bytes[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private static boolean asciiAt(byte[] bytes, int offset, String signature) {
        if (bytes.length < offset + signature.length()) return false;
        for (int i = 0; i < signature.length(); i++) {
            if (bytes[offset + i] != signature.charAt(i)) return false;
        }
        return true;
    }
}
