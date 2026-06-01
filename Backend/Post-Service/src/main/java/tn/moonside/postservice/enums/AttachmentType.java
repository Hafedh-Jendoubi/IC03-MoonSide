package tn.moonside.postservice.enums;

/**
 * High-level category for a post attachment.
 * Derived automatically from the MIME content-type on upload.
 */
public enum AttachmentType {
    IMAGE,      // image/*
    VIDEO,      // video/*
    AUDIO,      // audio/*
    DOCUMENT,   // PDF, Word, Excel, PowerPoint, text, …
    OTHER
}
