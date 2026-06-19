-- ============================================================
-- Scout Connect - Full MySQL Database Schema
-- Compatible with XAMPP / MySQL 5.7+ / MariaDB 10.4+
-- ============================================================

CREATE DATABASE IF NOT EXISTS scout_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scout_connect;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS TABLE (replaces Base44 User entity + auth.me())
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('user','leader','admin') NOT NULL DEFAULT 'user',
    avatar          TEXT,
    phone           VARCHAR(50),
    date_of_birth   DATE,
    scout_id        VARCHAR(50) UNIQUE,
    scout_rank      ENUM('abatoni','inkesha','abahizi','ingenzi','elder'),
    bio             TEXT,
    location        VARCHAR(255),
    unit_id         VARCHAR(36),
    unit_name       VARCHAR(255),
    clan_id         VARCHAR(36),
    clan_name       VARCHAR(255),
    is_verified     TINYINT(1) NOT NULL DEFAULT 0,
    is_org_leader   TINYINT(1) NOT NULL DEFAULT 0,
    org_leader_role VARCHAR(255),
    org_leader_position VARCHAR(255),
    has_wood_badge  TINYINT(1) NOT NULL DEFAULT 0,
    wood_badge_beads TINYINT,
    wood_badge_status ENUM('pending','approved','rejected'),
    theme           ENUM('light','dark','system') DEFAULT 'light',
    onboarding_complete TINYINT(1) NOT NULL DEFAULT 0,
    last_login      DATETIME,
    reset_token     VARCHAR(100),
    reset_token_expires DATETIME,
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_scout_id (scout_id),
    INDEX idx_role (role),
    INDEX idx_unit_id (unit_id),
    INDEX idx_clan_id (clan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id          VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id     VARCHAR(36) NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PUBLIC PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public_profiles (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL UNIQUE,
    full_name       VARCHAR(255),
    username        VARCHAR(100) UNIQUE,
    email           VARCHAR(255),
    avatar          TEXT,
    bio             TEXT,
    location        VARCHAR(255),
    unit_name       VARCHAR(255),
    clan_name       VARCHAR(255),
    rank            VARCHAR(50),
    followers_count INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    posts_count     INT NOT NULL DEFAULT 0,
    is_verified     TINYINT(1) NOT NULL DEFAULT 0,
    is_org_leader   TINYINT(1) NOT NULL DEFAULT 0,
    wood_badge_beads TINYINT DEFAULT 0,
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE IF NOT EXISTS units (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    location        VARCHAR(255),
    admin_id        VARCHAR(36),
    admin_email     VARCHAR(255),
    members         JSON,
    member_count    INT NOT NULL DEFAULT 0,
    points          INT NOT NULL DEFAULT 0,
    status          ENUM('active','inactive') DEFAULT 'active',
    avatar          TEXT,
    cover_image     TEXT,
    founded_date    DATE,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (admin_email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS clans (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    location        VARCHAR(255),
    admin_id        VARCHAR(36),
    admin_email     VARCHAR(255),
    leaders         JSON,
    members         JSON,
    member_count    INT NOT NULL DEFAULT 0,
    points          INT NOT NULL DEFAULT 0,
    status          ENUM('active','inactive') DEFAULT 'active',
    avatar          TEXT,
    cover_image     TEXT,
    founded_date    DATE,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (admin_email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    author_id       VARCHAR(36) NOT NULL,
    author_name     VARCHAR(255),
    author_avatar   TEXT,
    content         TEXT,
    media_urls      JSON,
    media_type      ENUM('image','video','text') DEFAULT 'image',
    status          ENUM('pending','approved','rejected') DEFAULT 'pending',
    is_unit_post    TINYINT(1) DEFAULT 0,
    unit_id         VARCHAR(36),
    clan_id         VARCHAR(36),
    work_category   ENUM('visiting','community_work','illiterates_visit','services','others','none') DEFAULT 'none',
    points_awarded  INT DEFAULT 0,
    likes_count     INT DEFAULT 0,
    comments_count  INT DEFAULT 0,
    shares_count    INT DEFAULT 0,
    music_id        VARCHAR(36),
    music_title     VARCHAR(255),
    location        VARCHAR(255),
    tags            JSON,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_author (author_id),
    INDEX idx_status (status),
    INDEX idx_unit (unit_id),
    INDEX idx_clan (clan_id),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    author_id       VARCHAR(36) NOT NULL,
    author_name     VARCHAR(255),
    author_avatar   TEXT,
    media_url       TEXT,
    media_type      ENUM('image','video') DEFAULT 'image',
    caption         TEXT,
    music_id        VARCHAR(36),
    music_title     VARCHAR(255),
    views           JSON,
    expires_at      DATETIME,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_author (author_id),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    post_id         VARCHAR(36) NOT NULL,
    author_id       VARCHAR(36) NOT NULL,
    author_name     VARCHAR(255),
    author_avatar   TEXT,
    content         TEXT NOT NULL,
    likes_count     INT DEFAULT 0,
    parent_id       VARCHAR(36),
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_post (post_id),
    INDEX idx_author (author_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    post_id         VARCHAR(36),
    comment_id      VARCHAR(36),
    user_id         VARCHAR(36) NOT NULL,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_post_like (post_id, user_id),
    UNIQUE KEY unique_comment_like (comment_id, user_id),
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    follower_id     VARCHAR(36) NOT NULL,
    following_id    VARCHAR(36) NOT NULL,
    follower_name   VARCHAR(255),
    following_name  VARCHAR(255),
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    type            ENUM('direct','group') DEFAULT 'direct',
    participants    JSON,
    participant_details JSON,
    group_name      VARCHAR(255),
    group_avatar    TEXT,
    last_message    TEXT,
    last_message_at DATETIME,
    last_sender_id  VARCHAR(36),
    unread_count    JSON,
    typing_users    JSON,
    call_signal     TEXT,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id       VARCHAR(36) NOT NULL,
    sender_name     VARCHAR(255),
    sender_avatar   TEXT,
    content         TEXT,
    media_url       TEXT,
    media_type      ENUM('text','image','video','audio','file') DEFAULT 'text',
    reply_to        VARCHAR(36),
    reply_preview   TEXT,
    reactions       JSON,
    read_by         JSON,
    delivered_to    JSON,
    deleted_for     JSON,
    is_deleted      TINYINT(1) DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    type            ENUM('like','comment','follow','badge','event','system','mention') NOT NULL,
    title           VARCHAR(255),
    message         TEXT,
    actor_id        VARCHAR(36),
    actor_name      VARCHAR(255),
    actor_avatar    TEXT,
    reference_id    VARCHAR(36),
    reference_type  VARCHAR(50),
    is_read         TINYINT(1) DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    icon            TEXT,
    category        ENUM('outdoor','service','skills','leadership','special','achievement') DEFAULT 'skills',
    level           ENUM('bronze','silver','gold','platinum') DEFAULT 'bronze',
    points          INT DEFAULT 10,
    requirements    TEXT,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    badge_id        VARCHAR(36),
    badge_name      VARCHAR(255),
    badge_icon      TEXT,
    earned_date     DATE,
    status          ENUM('earned','pending','revoked') DEFAULT 'earned',
    awarded_by      VARCHAR(36),
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_badge (badge_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BADGE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS badge_requests (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    requester_id    VARCHAR(36) NOT NULL,
    requester_name  VARCHAR(255),
    badge_id        VARCHAR(36),
    badge_name      VARCHAR(255),
    request_type    ENUM('earn','verify') DEFAULT 'earn',
    reason          TEXT,
    evidence_urls   JSON,
    status          ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_requester (requester_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    event_type      VARCHAR(100),
    organizer_id    VARCHAR(36),
    organizer_name  VARCHAR(255),
    location        VARCHAR(255),
    start_date      DATETIME,
    end_date        DATETIME,
    cover_image     TEXT,
    max_participants INT,
    participants    JSON,
    status          ENUM('pending','approved','cancelled') DEFAULT 'pending',
    unit_id         VARCHAR(36),
    clan_id         VARCHAR(36),
    tags            JSON,
    is_public       TINYINT(1) DEFAULT 1,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_organizer (organizer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTS (Marketplace)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        ENUM('uniforms','tents','ropes','compasses','camping_gear','books','other') DEFAULT 'other',
    price           DECIMAL(10,2) DEFAULT 0,
    condition       ENUM('new','like_new','good','fair') DEFAULT 'good',
    images          JSON,
    thumbnail       TEXT,
    seller_id       VARCHAR(36),
    seller_name     VARCHAR(255),
    seller_phone    VARCHAR(50),
    location        VARCHAR(255),
    is_donation     TINYINT(1) DEFAULT 0,
    status          ENUM('pending','approved','sold','removed') DEFAULT 'pending',
    views_count     INT DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_seller (seller_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RENTAL LISTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_listings (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    images          JSON,
    price_per_day   DECIMAL(10,2) DEFAULT 0,
    deposit         DECIMAL(10,2) DEFAULT 0,
    condition       ENUM('new','like_new','good','fair') DEFAULT 'good',
    location        VARCHAR(255),
    owner_id        VARCHAR(36),
    owner_name      VARCHAR(255),
    owner_phone     VARCHAR(50),
    status          ENUM('available','rented','unavailable') DEFAULT 'available',
    available_from  DATE,
    available_to    DATE,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ORDERS / CART
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    buyer_id        VARCHAR(36) NOT NULL,
    buyer_name      VARCHAR(255),
    items           JSON,
    total_amount    DECIMAL(10,2) DEFAULT 0,
    status          ENUM('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
    payment_method  VARCHAR(100),
    payment_ref     VARCHAR(255),
    shipping_address TEXT,
    notes           TEXT,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_buyer (buyer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DIY TUTORIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS diy_tutorials (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    cover_image     TEXT,
    difficulty      ENUM('easy','medium','hard') DEFAULT 'easy',
    estimated_cost  DECIMAL(10,2) DEFAULT 0,
    steps           JSON,
    materials       JSON,
    author_id       VARCHAR(36),
    author_name     VARCHAR(255),
    status          ENUM('draft','published') DEFAULT 'published',
    views_count     INT DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MUSIC LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS music_library (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    artist          VARCHAR(255),
    genre           VARCHAR(100),
    audio_url       TEXT NOT NULL,
    cover_image     TEXT,
    duration        INT,
    plays_count     INT DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COURSES (Training)
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    cover_image     TEXT,
    instructor_id   VARCHAR(36),
    instructor_name VARCHAR(255),
    category        VARCHAR(100),
    level           ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
    duration_hours  DECIMAL(5,2),
    modules         JSON,
    enrolled_users  JSON,
    enrolled_count  INT DEFAULT 0,
    status          ENUM('draft','published','archived') DEFAULT 'published',
    is_free         TINYINT(1) DEFAULT 1,
    price           DECIMAL(10,2) DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COURSE ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    course_id       VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    progress        DECIMAL(5,2) DEFAULT 0,
    completed_modules JSON,
    completed        TINYINT(1) DEFAULT 0,
    completed_date  DATETIME,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (course_id, user_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    course_id       VARCHAR(36),
    questions       JSON,
    time_limit      INT,
    pass_score      INT DEFAULT 70,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- QUIZ RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    quiz_id         VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    score           INT DEFAULT 0,
    answers         JSON,
    passed          TINYINT(1) DEFAULT 0,
    time_taken      INT,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quiz (quiz_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ADVENTURES (AdventureFinder)
-- ============================================================
CREATE TABLE IF NOT EXISTS adventures (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    location        VARCHAR(255),
    difficulty      ENUM('easy','moderate','hard','expert') DEFAULT 'easy',
    activity_type   VARCHAR(100),
    cover_image     TEXT,
    images          JSON,
    requirements    TEXT,
    min_age         INT,
    max_participants INT,
    duration_days   INT,
    cost            DECIMAL(10,2) DEFAULT 0,
    organizer_id    VARCHAR(36),
    organizer_name  VARCHAR(255),
    status          ENUM('active','inactive') DEFAULT 'active',
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CAMP PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS camp_plans (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    user_id         VARCHAR(36) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    location        VARCHAR(255),
    participants    JSON,
    activities      JSON,
    equipment_list  JSON,
    meals           JSON,
    notes           TEXT,
    status          ENUM('planning','confirmed','completed','cancelled') DEFAULT 'planning',
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LEADERBOARD / COMPETITION HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_history (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    rankings        JSON,
    total_units     INT DEFAULT 0,
    total_clans     INT DEFAULT 0,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    plan            ENUM('free','basic','premium') DEFAULT 'free',
    status          ENUM('active','expired','cancelled') DEFAULT 'active',
    start_date      DATE,
    end_date        DATE,
    payment_ref     VARCHAR(255),
    amount          DECIMAL(10,2),
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- UNIT POSTS (special post type for unit activities)
-- ============================================================
CREATE TABLE IF NOT EXISTS unit_posts (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    post_id         VARCHAR(36),
    unit_id         VARCHAR(36),
    clan_id         VARCHAR(36),
    author_id       VARCHAR(36),
    title           VARCHAR(255),
    content         TEXT,
    media_urls      JSON,
    work_category   VARCHAR(100),
    points          INT DEFAULT 0,
    status          ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REVENUE TRACKER
-- ============================================================
CREATE TABLE IF NOT EXISTS revenue_records (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    user_id         VARCHAR(36),
    unit_id         VARCHAR(36),
    title           VARCHAR(255),
    type            ENUM('income','expense') DEFAULT 'income',
    amount          DECIMAL(10,2) DEFAULT 0,
    category        VARCHAR(100),
    description     TEXT,
    date            DATE,
    receipt_url     TEXT,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- HELP CENTER ARTICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS help_articles (
    id              VARCHAR(36) NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    content         TEXT,
    category        VARCHAR(100),
    tags            JSON,
    views_count     INT DEFAULT 0,
    is_published    TINYINT(1) DEFAULT 1,
    created_by_id   VARCHAR(36),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DEFAULT ADMIN USER (password: Admin@1234)
-- ============================================================
INSERT IGNORE INTO users (id, full_name, email, password_hash, role, onboarding_complete) 
VALUES (
    UUID(),
    'System Admin',
    'admin@scoutconnect.rw',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@1234
    'admin',
    1
);