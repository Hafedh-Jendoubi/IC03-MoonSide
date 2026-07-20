package tn.moonside.badgeservice.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * All badge definitions.  Each entry carries the metadata that the frontend
 * needs to render the badge card, plus the trigger type and threshold that
 * the award engine checks.
 *
 * trigger:    matches the activityType string published by User/Post-Service
 * threshold:  numeric value that must be reached (0 = "any single event")
 * icon:       Lucide icon name rendered on the frontend
 * category:   logical grouping for UI tabs
 */
@Getter
@RequiredArgsConstructor
public enum BadgeType {

    // ── First actions ─────────────────────────────────────────────────────────
    FIRST_POST(
            "First Post",
            "Published your very first post — welcome to the conversation!",
            "POST_CREATED", 1,
            "PenLine", BadgeCategory.CONTENT),
    FIRST_CONNECTION(
            "First Connection",
            "Made your first connection on WorkSphere — great start!",
            "CONNECTION_ACCEPTED", 1,
            "Handshake", BadgeCategory.NETWORK),
    PROFILE_COMPLETED(
            "Profile Complete",
            "Filled in your bio, job title, and profile photo — looking sharp!",
            "PROFILE_COMPLETED", 0,
            "UserCheck", BadgeCategory.PROFILE),
    EMAIL_VERIFIED(
            "Verified",
            "Confirmed your email address and secured your account.",
            "EMAIL_VERIFIED", 0,
            "ShieldCheck", BadgeCategory.PROFILE),

    // ── Post milestones ───────────────────────────────────────────────────────
    POSTS_10(
            "Getting Started",
            "Published 10 posts — you're finding your voice!",
            "POST_CREATED", 10,
            "Pencil", BadgeCategory.CONTENT),
    POSTS_50(
            "Regular Contributor",
            "Shared 50 posts with the community.",
            "POST_CREATED", 50,
            "BookOpen", BadgeCategory.CONTENT),
    POSTS_100(
            "Content Creator",
            "Reached 100 posts — a true content creator!",
            "POST_CREATED", 100,
            "Edit3", BadgeCategory.CONTENT),
    POSTS_500(
            "Prolific Writer",
            "Published 500 posts — an inspiration to the team.",
            "POST_CREATED", 500,
            "FileText", BadgeCategory.CONTENT),
    POSTS_1000(
            "Storyteller",
            "1 000 posts! Your words shape the culture of this workspace.",
            "POST_CREATED", 1000,
            "BookMarked", BadgeCategory.CONTENT),
    POSTS_5000(
            "Legend",
            "5 000 posts — an absolute legend of the platform.",
            "POST_CREATED", 5000,
            "Trophy", BadgeCategory.CONTENT),
    POSTS_10000(
            "10K Club",
            "10 000 posts. You are WorkSphere.",
            "POST_CREATED", 10000,
            "Star", BadgeCategory.CONTENT),

    // ── Connection milestones ─────────────────────────────────────────────────
    CONNECTIONS_10(
            "Social Butterfly",
            "Connected with 10 colleagues — your network is growing!",
            "CONNECTION_ACCEPTED", 10,
            "Users", BadgeCategory.NETWORK),
    CONNECTIONS_50(
            "Networker",
            "Built a network of 50 connections.",
            "CONNECTION_ACCEPTED", 50,
            "Network", BadgeCategory.NETWORK),
    CONNECTIONS_100(
            "Connector",
            "Reached 100 connections — you know everyone!",
            "CONNECTION_ACCEPTED", 100,
            "Globe", BadgeCategory.NETWORK),
    CONNECTIONS_250(
            "Community Builder",
            "250 connections — you are the glue of this community.",
            "CONNECTION_ACCEPTED", 250,
            "Building2", BadgeCategory.NETWORK),
    CONNECTIONS_500(
            "Super Connector",
            "An incredible 500 connections across the platform.",
            "CONNECTION_ACCEPTED", 500,
            "Zap", BadgeCategory.NETWORK),

    // ── Login-streak milestones ───────────────────────────────────────────────
    STREAK_3(
            "Habit Forming",
            "Logged in 3 days in a row — building great habits!",
            "LOGIN_STREAK", 3,
            "Flame", BadgeCategory.ENGAGEMENT),
    STREAK_7(
            "Week Warrior",
            "Logged in 7 days straight — a whole week!",
            "LOGIN_STREAK", 7,
            "Calendar", BadgeCategory.ENGAGEMENT),
    STREAK_14(
            "Two-Week Grind",
            "Two full weeks of consecutive daily logins.",
            "LOGIN_STREAK", 14,
            "CalendarCheck", BadgeCategory.ENGAGEMENT),
    STREAK_30(
            "Monthly Dedication",
            "30 straight days logged in — remarkably consistent!",
            "LOGIN_STREAK", 30,
            "Award", BadgeCategory.ENGAGEMENT),
    STREAK_90(
            "Quarter Champion",
            "90 consecutive days of logging in — an elite dedication!",
            "LOGIN_STREAK", 90,
            "Medal", BadgeCategory.ENGAGEMENT),
    STREAK_365(
            "Year-Round Legend",
            "A full year of consecutive daily logins. Absolutely legendary.",
            "LOGIN_STREAK", 365,
            "Crown", BadgeCategory.ENGAGEMENT);

    private final String displayName;
    private final String description;
    /** activityType string emitted by Kafka producers. */
    private final String triggerActivity;
    /**
     * Threshold value.  0 = award on the first event of this type (boolean trigger).
     * >0 = award when the event's value is &gt;= threshold.
     */
    private final int threshold;
    /** Lucide React icon name to render on the frontend. */
    private final String icon;
    private final BadgeCategory category;
}
