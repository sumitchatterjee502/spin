-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 24, 2026 at 12:57 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `spin_platform`
--

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `campaigns`
--

INSERT INTO `campaigns` (`id`, `name`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Summer Campaign', '2026-04-23 00:00:00', '2026-07-31 23:59:59', 'ACTIVE', '2026-04-24 09:47:09', '2026-04-24 09:47:09');

-- --------------------------------------------------------

--
-- Table structure for table `campaign_products`
--

CREATE TABLE `campaign_products` (
  `id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `campaign_products`
--

INSERT INTO `campaign_products` (`id`, `campaign_id`, `product_id`) VALUES
(6, 1, 1),
(7, 1, 2),
(8, 1, 3),
(9, 1, 4),
(10, 1, 5),
(11, 1, 6),
(12, 1, 7),
(13, 1, 8);

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `email` varchar(320) NOT NULL,
  `shop_location` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `accept_terms` tinyint(1) NOT NULL DEFAULT 0,
  `address` varchar(255) DEFAULT NULL,
  `campaign_id` int(10) UNSIGNED DEFAULT NULL,
  `qr_mapping_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `name`, `phone`, `email`, `shop_location`, `created_at`, `updated_at`, `accept_terms`, `address`, `campaign_id`, `qr_mapping_id`) VALUES
(1, 'sumit', '9876543210', 'test@test.com', 'asdasdsa', '2026-04-24 09:54:24', '2026-04-24 09:54:24', 1, 'sadsadsa', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `participations`
--

CREATE TABLE `participations` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `status` enum('PENDING','WON','LOST','APPROVED','VERIFIED','CONFIRMED','PROCESSING','DISPATCHED','DELIVERED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invoice_number` varchar(128) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `fulfillment_status` enum('APPROVED','PROCESSING','DISPATCHED','DELIVERED') DEFAULT NULL,
  `tracking_id` varchar(128) DEFAULT NULL,
  `delivery_partner` varchar(128) DEFAULT NULL,
  `address` varchar(512) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `dispatch_date` datetime DEFAULT NULL,
  `delivery_date` datetime DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `participations`
--

INSERT INTO `participations` (`id`, `user_id`, `campaign_id`, `product_id`, `status`, `created_at`, `updated_at`, `invoice_number`, `remarks`, `verified_at`, `fulfillment_status`, `tracking_id`, `delivery_partner`, `address`, `confirmed_at`, `dispatch_date`, `delivery_date`, `is_locked`) VALUES
(1, 1, 1, 1, 'LOST', '2026-04-24 09:54:24', '2026-04-24 09:54:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `permission_key` varchar(128) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `permission_key`, `description`, `created_at`, `updated_at`) VALUES
(1, 'rbac:manage', 'rbac:manage', '2026-04-24 09:14:07', '2026-04-24 09:14:07'),
(2, 'campaign-setup:read', 'campaign:read', '2026-04-24 09:14:07', '2026-04-24 15:06:15'),
(3, 'campaign-setup:create', 'campaign:create', '2026-04-24 09:14:07', '2026-04-24 15:06:24'),
(4, 'campaign-setup:delete', 'campaign:delete', '2026-04-24 09:14:07', '2026-04-24 15:06:34'),
(5, 'product:read', 'product:read', '2026-04-24 09:14:07', '2026-04-24 09:14:07'),
(6, 'product:create', 'product:create', '2026-04-24 09:14:07', '2026-04-24 14:48:09'),
(7, 'participation:read', 'participation:read', '2026-04-24 09:14:07', '2026-04-24 09:14:07'),
(8, 'spin:read', 'spin:read', '2026-04-24 09:14:07', '2026-04-24 14:47:53'),
(9, 'fraud:read', 'fraud:read', '2026-04-24 09:14:07', '2026-04-24 14:48:46'),
(10, 'verification:read', 'verification:read', '2026-04-24 09:14:07', '2026-04-24 14:48:35'),
(11, 'fulfillment:read', 'fulfillment:read', '2026-04-24 09:14:07', '2026-04-24 14:48:21'),
(12, 'notification:send', 'notification:send', '2026-04-24 09:14:07', '2026-04-24 09:14:07'),
(13, 'settings:read', 'settings:read', '2026-04-24 14:50:54', '2026-04-24 14:50:54'),
(14, 'permission-management:read', 'permission-management:read', '2026-04-24 14:52:35', '2026-04-24 14:52:35'),
(15, 'permission-management:update', 'permission-management:update', '2026-04-24 14:52:35', '2026-04-24 14:52:35'),
(16, 'permission-management:delete', 'permission-management:delete', '2026-04-24 14:52:35', '2026-04-24 14:52:35'),
(17, 'role-management:read', 'role-management:read', '2026-04-24 14:55:00', '2026-04-24 14:55:00'),
(18, 'role-management:update', 'role-management:update', '2026-04-24 14:55:00', '2026-04-24 14:55:00'),
(19, 'role-management:delete', 'role-management:delete', '2026-04-24 14:55:00', '2026-04-24 14:55:00'),
(20, 'role-management:assign', 'role-management:assign', '2026-04-24 14:55:00', '2026-04-24 14:55:00'),
(21, 'prize-configuration:read', 'prize-configuration:read', '2026-04-24 09:34:31', '2026-04-24 09:34:31'),
(22, 'prize-configuration:create', 'prize-configuration:create', '2026-04-24 09:34:43', '2026-04-24 09:34:43'),
(23, 'prize-configuration:update', 'prize-configuration:update', '2026-04-24 09:34:54', '2026-04-24 09:34:54'),
(24, 'prize-configuration:delete', 'prize-configuration:delete', '2026-04-24 09:35:04', '2026-04-24 09:35:04'),
(25, 'spin-configuration:read', 'spin-configuration:read', '2026-04-24 09:35:21', '2026-04-24 09:35:21'),
(26, 'spin-configuration:create', 'spin-configuration:create', '2026-04-24 09:35:34', '2026-04-24 09:35:34'),
(27, 'spin-configuration:update', 'spin-configuration:update', '2026-04-24 09:35:43', '2026-04-24 09:35:43'),
(28, 'spin-configuration:delete', 'spin-configuration:delete', '2026-04-24 09:35:53', '2026-04-24 09:35:53'),
(29, 'campaign-setup:update', 'campaign-setup:update', '2026-04-24 09:14:07', '2026-04-24 15:06:24'),
(30, 'product-setup:read', 'product-setup:read', '2026-04-24 09:38:06', '2026-04-24 09:38:06'),
(31, 'product-setup:create', 'product-setup:create', '2026-04-24 09:38:15', '2026-04-24 09:38:15'),
(32, 'product-setup:update', 'product-setup:update', '2026-04-24 09:38:23', '2026-04-24 09:38:23'),
(33, 'product-setup:delete', 'product-setup:delete', '2026-04-24 09:38:31', '2026-04-24 09:38:31'),
(34, 'admin-management:read', 'admin-management:read', '2026-04-24 09:39:10', '2026-04-24 09:39:10'),
(35, 'admin-management:create', 'admin-management:create', '2026-04-24 09:39:19', '2026-04-24 09:39:19'),
(36, 'admin-management:update', 'admin-management:update', '2026-04-24 09:39:29', '2026-04-24 09:39:29'),
(37, 'admin-management:delete', 'admin-management:delete', '2026-04-24 09:39:37', '2026-04-24 09:39:37'),
(38, 'qr-mapping:read', 'qr-mapping:read', '2026-04-24 09:41:09', '2026-04-24 09:41:09'),
(39, 'qr-mapping:create', 'qr-mapping:create', '2026-04-24 09:41:18', '2026-04-24 09:41:18'),
(40, 'qr-mapping:update', 'qr-mapping:update', '2026-04-24 09:41:26', '2026-04-24 09:41:26'),
(41, 'qr-mapping:delete', 'qr-mapping:delete', '2026-04-24 09:41:36', '2026-04-24 09:41:36');

-- --------------------------------------------------------

--
-- Table structure for table `prizes`
--

CREATE TABLE `prizes` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prizes`
--

INSERT INTO `prizes` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Movie Ticket', '2026-04-24 09:48:50', '2026-04-24 09:48:50'),
(2, 'Bluetooth Speaker', '2026-04-24 09:49:01', '2026-04-24 09:49:01'),
(3, 'Fitness Bottle', '2026-04-24 09:49:11', '2026-04-24 09:49:11'),
(4, 'Free Snack Combo', '2026-04-24 09:49:25', '2026-04-24 09:49:25'),
(5, 'Kitchen Set', '2026-04-24 09:49:33', '2026-04-24 09:49:33'),
(6, 'Grocery Voucher', '2026-04-24 09:49:53', '2026-04-24 09:49:53'),
(7, 'Smart TV', '2026-04-24 09:50:05', '2026-04-24 09:50:05'),
(8, 'Smartphone', '2026-04-24 09:50:12', '2026-04-24 09:50:12'),
(9, 'Laptop Bag', '2026-04-24 09:50:20', '2026-04-24 09:50:20');

-- --------------------------------------------------------

--
-- Table structure for table `prize_configs`
--

CREATE TABLE `prize_configs` (
  `id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `max_per_day` int(10) UNSIGNED NOT NULL,
  `max_per_user` int(10) UNSIGNED NOT NULL,
  `total_limit` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prize_configs`
--

INSERT INTO `prize_configs` (`id`, `campaign_id`, `max_per_day`, `max_per_user`, `total_limit`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 8, '2026-04-24 09:53:00', '2026-04-24 09:53:00');

-- --------------------------------------------------------

--
-- Table structure for table `prize_inventories`
--

CREATE TABLE `prize_inventories` (
  `id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `prize_id` int(10) UNSIGNED NOT NULL,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prize_inventories`
--

INSERT INTO `prize_inventories` (`id`, `campaign_id`, `prize_id`, `stock`) VALUES
(1, 1, 1, 10),
(2, 1, 5, 10),
(3, 1, 9, 9);

-- --------------------------------------------------------

--
-- Table structure for table `prize_mappings`
--

CREATE TABLE `prize_mappings` (
  `id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `prize_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prize_mappings`
--

INSERT INTO `prize_mappings` (`id`, `campaign_id`, `product_id`, `prize_id`) VALUES
(1, 1, 1, 1),
(2, 1, 8, 5),
(3, 1, 3, 1),
(4, 1, 2, 9);

-- --------------------------------------------------------

--
-- Table structure for table `probabilities`
--

CREATE TABLE `probabilities` (
  `id` int(10) UNSIGNED NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `prize_id` int(10) UNSIGNED DEFAULT NULL,
  `weight` int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `probabilities`
--

INSERT INTO `probabilities` (`id`, `campaign_id`, `prize_id`, `weight`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(2, 1, 2, 1, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(3, 1, 3, 1, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(4, 1, 4, 0, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(5, 1, 5, 0, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(6, 1, 6, 0, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(7, 1, 7, 0, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(8, 1, 8, 0, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(9, 1, 9, 0, '2026-04-24 09:53:31', '2026-04-24 09:53:31'),
(10, 1, NULL, 97, '2026-04-24 09:53:31', '2026-04-24 09:53:31');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Biscuits', '2026-04-24 09:44:53', '2026-04-24 09:44:53'),
(2, 'Tea', '2026-04-24 09:45:08', '2026-04-24 09:45:08'),
(3, 'Chocolates', '2026-04-24 09:45:32', '2026-04-24 09:45:32'),
(4, 'Spices', '2026-04-24 09:45:39', '2026-04-24 09:45:39'),
(5, 'dairy', '2026-04-24 09:45:48', '2026-04-24 09:45:48'),
(6, 'Deodorants', '2026-04-24 09:45:57', '2026-04-24 09:45:57'),
(7, 'Aluminum Foil', '2026-04-24 09:46:13', '2026-04-24 09:46:13'),
(8, 'Laundry Detergents', '2026-04-24 09:46:37', '2026-04-24 09:46:37');

-- --------------------------------------------------------

--
-- Table structure for table `qr_frontend_settings`
--

CREATE TABLE `qr_frontend_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `frontend_base_url` varchar(2048) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `qr_frontend_settings`
--

INSERT INTO `qr_frontend_settings` (`id`, `frontend_base_url`, `created_at`, `updated_at`) VALUES
(1, 'http://localhost:3004', '2026-04-24 09:13:07', '2026-04-24 09:53:38');

-- --------------------------------------------------------

--
-- Table structure for table `qr_mappings`
--

CREATE TABLE `qr_mappings` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(64) NOT NULL,
  `campaign_id` int(10) UNSIGNED NOT NULL,
  `redirect_url` varchar(2048) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `qr_mappings`
--

INSERT INTO `qr_mappings` (`id`, `code`, `campaign_id`, `redirect_url`, `is_active`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'SD8QXCAJ8L', 1, 'http://localhost:3004/campaign?qr=SD8QXCAJ8L', 1, NULL, '2026-04-24 09:53:45', '2026-04-24 09:53:45');

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` int(10) UNSIGNED NOT NULL,
  `lead_id` int(10) UNSIGNED DEFAULT NULL,
  `file_url` varchar(2048) NOT NULL,
  `receipt_number` varchar(128) NOT NULL,
  `file_type` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `hash` varchar(64) NOT NULL,
  `p_hash` varchar(64) DEFAULT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `receipts`
--

INSERT INTO `receipts` (`id`, `lead_id`, `file_url`, `receipt_number`, `file_type`, `created_at`, `user_id`, `hash`, `p_hash`, `is_used`) VALUES
(1, 1, 'http://localhost:3000/uploads/receipts/Grocery-receipt-from-Fresh-Mart-1777024464088-830609184.png', 'REC123', 'image/png', '2026-04-24 09:54:24', NULL, '7c0922c49a31a871843c01925107a87f5b62aeac8d77612b9932216a93f30cb2', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Full platform access', '2026-04-24 09:14:07', '2026-04-24 09:14:07'),
(2, 'operator', 'Operational access without RBAC admin', '2026-04-24 09:14:07', '2026-04-24 09:14:07'),
(3, 'participant', 'Default self-service participant', '2026-04-24 09:14:07', '2026-04-24 09:14:07');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(1, 40),
(1, 41),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(3, 2),
(3, 5),
(3, 7),
(3, 8);

-- --------------------------------------------------------

--
-- Table structure for table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sequelizemeta`
--

INSERT INTO `sequelizemeta` (`name`) VALUES
('20260418000000-initial-placeholder.ts'),
('20260418000001-rbac-schema.ts'),
('20260418000003-campaign-product-schema.ts'),
('20260418000004-products-name-unique.ts'),
('20260418000005-prize-config-schema.ts'),
('20260418000006-probabilities-schema.ts'),
('20260418000007-qr-mappings.ts'),
('20260419000001-qr-frontend-settings.ts'),
('20260419000002-lead-and-receipt-schema.ts'),
('20260419000003-add-accept-terms-to-leads.ts'),
('20260419000004-add-landing-fields-to-leads.ts'),
('20260420000001-spin-engine-schema.ts'),
('20260420000002-receipt-hash-dedup.ts'),
('20260422000003-participation-verification-fields.ts'),
('20260422000004-invoice-fulfillment-fields.ts'),
('20260422000005-fulfillment-confirmation-fields.ts');

-- --------------------------------------------------------

--
-- Table structure for table `spin_results`
--

CREATE TABLE `spin_results` (
  `id` int(10) UNSIGNED NOT NULL,
  `participation_id` int(10) UNSIGNED NOT NULL,
  `result` enum('WIN','LOSE') NOT NULL,
  `prize_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spin_results`
--

INSERT INTO `spin_results` (`id`, `participation_id`, `result`, `prize_id`, `created_at`, `updated_at`) VALUES
(1, 1, 'LOSE', NULL, '2026-04-24 09:54:28', '2026-04-24 09:54:28');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `created_at`, `updated_at`) VALUES
(1, 'admin@example.com', '$2b$10$rYHrMH8YNAmQWrtebE.fse5U.zHONbIb3LVdhKTkH/LaeLDr5HYX2', 'Admin', 'User', '2026-04-24 09:14:07', '2026-04-24 09:14:07');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `campaign_products`
--
ALTER TABLE `campaign_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `campaign_products_campaign_id_product_id_unique` (`campaign_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leads_phone_idx` (`phone`),
  ADD KEY `leads_email_idx` (`email`),
  ADD KEY `leads_campaign_id_idx` (`campaign_id`),
  ADD KEY `leads_qr_mapping_id_idx` (`qr_mapping_id`);

--
-- Indexes for table `participations`
--
ALTER TABLE `participations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `participations_invoice_number_unique` (`invoice_number`),
  ADD KEY `participations_campaign_id_idx` (`campaign_id`),
  ADD KEY `participations_product_id_idx` (`product_id`),
  ADD KEY `participations_user_id_idx` (`user_id`),
  ADD KEY `participations_verified_at_idx` (`verified_at`),
  ADD KEY `participations_status_idx` (`status`),
  ADD KEY `participations_updated_at_idx` (`updated_at`),
  ADD KEY `participations_fulfillment_status_idx` (`fulfillment_status`),
  ADD KEY `participations_status_idx_v2` (`status`),
  ADD KEY `participations_confirmed_at_idx` (`confirmed_at`),
  ADD KEY `participations_updated_at_idx_v2` (`updated_at`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_key` (`permission_key`);

--
-- Indexes for table `prizes`
--
ALTER TABLE `prizes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `prize_configs`
--
ALTER TABLE `prize_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `campaign_id` (`campaign_id`);

--
-- Indexes for table `prize_inventories`
--
ALTER TABLE `prize_inventories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `prize_inventories_campaign_id_prize_id_unique` (`campaign_id`,`prize_id`),
  ADD KEY `prize_id` (`prize_id`);

--
-- Indexes for table `prize_mappings`
--
ALTER TABLE `prize_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `prize_mappings_campaign_id_product_id_unique` (`campaign_id`,`product_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `prize_id` (`prize_id`);

--
-- Indexes for table `probabilities`
--
ALTER TABLE `probabilities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `probabilities_campaign_id_prize_id_unique` (`campaign_id`,`prize_id`),
  ADD KEY `prize_id` (`prize_id`),
  ADD KEY `probabilities_campaign_id_idx` (`campaign_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_name_unique` (`name`);

--
-- Indexes for table `qr_frontend_settings`
--
ALTER TABLE `qr_frontend_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `qr_mappings`
--
ALTER TABLE `qr_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `qr_mappings_campaign_id_idx` (`campaign_id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipts_receipt_number_unique` (`receipt_number`),
  ADD UNIQUE KEY `unique_receipt_hash` (`hash`),
  ADD KEY `receipts_lead_id_idx` (`lead_id`),
  ADD KEY `receipts_user_id_idx` (`user_id`),
  ADD KEY `receipts_p_hash_idx` (`p_hash`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `spin_results`
--
ALTER TABLE `spin_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `spin_results_participation_id_unique` (`participation_id`),
  ADD KEY `spin_results_prize_id_idx` (`prize_id`),
  ADD KEY `spin_results_created_at_idx` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `campaigns`
--
ALTER TABLE `campaigns`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `campaign_products`
--
ALTER TABLE `campaign_products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `participations`
--
ALTER TABLE `participations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `prizes`
--
ALTER TABLE `prizes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `prize_configs`
--
ALTER TABLE `prize_configs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `prize_inventories`
--
ALTER TABLE `prize_inventories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `prize_mappings`
--
ALTER TABLE `prize_mappings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `probabilities`
--
ALTER TABLE `probabilities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `qr_mappings`
--
ALTER TABLE `qr_mappings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `spin_results`
--
ALTER TABLE `spin_results`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `campaign_products`
--
ALTER TABLE `campaign_products`
  ADD CONSTRAINT `campaign_products_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `campaign_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_campaign_id_foreign_idx` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_qr_mapping_id_foreign_idx` FOREIGN KEY (`qr_mapping_id`) REFERENCES `qr_mappings` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `participations`
--
ALTER TABLE `participations`
  ADD CONSTRAINT `participations_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `participations_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `prize_configs`
--
ALTER TABLE `prize_configs`
  ADD CONSTRAINT `prize_configs_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `prize_inventories`
--
ALTER TABLE `prize_inventories`
  ADD CONSTRAINT `prize_inventories_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `prize_inventories_ibfk_2` FOREIGN KEY (`prize_id`) REFERENCES `prizes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `prize_mappings`
--
ALTER TABLE `prize_mappings`
  ADD CONSTRAINT `prize_mappings_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `prize_mappings_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `prize_mappings_ibfk_3` FOREIGN KEY (`prize_id`) REFERENCES `prizes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `probabilities`
--
ALTER TABLE `probabilities`
  ADD CONSTRAINT `probabilities_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `probabilities_ibfk_2` FOREIGN KEY (`prize_id`) REFERENCES `prizes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `qr_mappings`
--
ALTER TABLE `qr_mappings`
  ADD CONSTRAINT `qr_mappings_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `receipts`
--
ALTER TABLE `receipts`
  ADD CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `receipts_user_id_foreign_idx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `spin_results`
--
ALTER TABLE `spin_results`
  ADD CONSTRAINT `spin_results_ibfk_1` FOREIGN KEY (`participation_id`) REFERENCES `participations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `spin_results_ibfk_2` FOREIGN KEY (`prize_id`) REFERENCES `prizes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
