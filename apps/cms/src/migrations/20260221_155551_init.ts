import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_pages_blocks_deal_slot_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_deal_slot_show_on" AS ENUM('header', 'burger', 'section');
  CREATE TYPE "public"."enum_pages_blocks_campaign_slot_render_mode" AS ENUM('popup', 'floating_bar');
  CREATE TYPE "public"."enum_pages_blocks_form_embed_layout" AS ENUM('default', 'compact', 'wide');
  CREATE TYPE "public"."enum_pages_page_type" AS ENUM('brand', 'location', 'landing', 'default');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_deal_slot_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_deal_slot_show_on" AS ENUM('header', 'burger', 'section');
  CREATE TYPE "public"."enum__pages_v_blocks_campaign_slot_render_mode" AS ENUM('popup', 'floating_bar');
  CREATE TYPE "public"."enum__pages_v_blocks_form_embed_layout" AS ENUM('default', 'compact', 'wide');
  CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('brand', 'location', 'landing', 'default');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_weekly_weekdays" AS ENUM('wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TYPE "public"."enum_events_weekly_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_events_upcoming_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_upcoming_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_deals_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__deals_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_campaigns_type" AS ENUM('popup', 'floating_bar');
  CREATE TYPE "public"."enum_campaigns_targeting_device" AS ENUM('all', 'desktop', 'mobile');
  CREATE TYPE "public"."enum_campaigns_timing_trigger" AS ENUM('delay', 'scroll', 'exit_intent');
  CREATE TYPE "public"."enum_campaigns_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__campaigns_v_version_type" AS ENUM('popup', 'floating_bar');
  CREATE TYPE "public"."enum__campaigns_v_version_targeting_device" AS ENUM('all', 'desktop', 'mobile');
  CREATE TYPE "public"."enum__campaigns_v_version_timing_trigger" AS ENUM('delay', 'scroll', 'exit_intent');
  CREATE TYPE "public"."enum__campaigns_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_forms_fields_type" AS ENUM('text', 'textarea', 'email', 'phone', 'number', 'dropdown', 'checkbox', 'radio', 'date', 'time', 'hidden', 'consent');
  CREATE TYPE "public"."enum_forms_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_forms_zendesk_mode" AS ENUM('none', 'email', 'webhook');
  CREATE TYPE "public"."enum__forms_v_version_fields_type" AS ENUM('text', 'textarea', 'email', 'phone', 'number', 'dropdown', 'checkbox', 'radio', 'date', 'time', 'hidden', 'consent');
  CREATE TYPE "public"."enum__forms_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__forms_v_version_zendesk_mode" AS ENUM('none', 'email', 'webhook');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'open', 'done');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"subline" varchar,
  	"background_image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_deal_slot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_pages_blocks_deal_slot_mode" DEFAULT 'auto',
  	"deal_id" integer,
  	"show_on" "enum_pages_blocks_deal_slot_show_on" DEFAULT 'section',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_campaign_slot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"campaign_id" integer,
  	"render_mode" "enum_pages_blocks_campaign_slot_render_mode" DEFAULT 'popup',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_weekly_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_override" varchar,
  	"location_slug" varchar,
  	"highlight_today" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_upcoming_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title_override" varchar,
  	"location_slug" varchar,
  	"highlight_only" boolean DEFAULT false,
  	"max_items" numeric DEFAULT 6,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_form_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"title_override" varchar,
  	"layout" "enum_pages_blocks_form_embed_layout" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"page_type" "enum_pages_page_type" DEFAULT 'default',
  	"legacy_content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_canonical" varchar,
  	"seo_og_image_id" integer,
  	"seo_noindex" boolean DEFAULT false,
  	"seo_json_ld" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"subline" varchar,
  	"background_image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_deal_slot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__pages_v_blocks_deal_slot_mode" DEFAULT 'auto',
  	"deal_id" integer,
  	"show_on" "enum__pages_v_blocks_deal_slot_show_on" DEFAULT 'section',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_campaign_slot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"campaign_id" integer,
  	"render_mode" "enum__pages_v_blocks_campaign_slot_render_mode" DEFAULT 'popup',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_weekly_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_override" varchar,
  	"location_slug" varchar,
  	"highlight_today" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_upcoming_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title_override" varchar,
  	"location_slug" varchar,
  	"highlight_only" boolean DEFAULT false,
  	"max_items" numeric DEFAULT 6,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"title_override" varchar,
  	"layout" "enum__pages_v_blocks_form_embed_layout" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_page_type" "enum__pages_v_version_page_type" DEFAULT 'default',
  	"version_legacy_content" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_canonical" varchar,
  	"version_seo_og_image_id" integer,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_seo_json_ld" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"address" varchar,
  	"city" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"geo" jsonb,
  	"opening_hours" jsonb,
  	"description" varchar,
  	"seo" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "locations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "events_weekly_weekdays" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_events_weekly_weekdays",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "events_weekly" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description_short" varchar,
  	"description_long" varchar,
  	"start_time" varchar,
  	"end_time" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_link" varchar,
  	"sort_order" numeric DEFAULT 100,
  	"status" "enum_events_weekly_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_weekly_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locations_id" integer
  );
  
  CREATE TABLE "events_upcoming" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"start_date_time" timestamp(3) with time zone,
  	"end_date_time" timestamp(3) with time zone,
  	"description" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_link" varchar,
  	"highlight" boolean DEFAULT false,
  	"priority" numeric DEFAULT 0,
  	"status" "enum_events_upcoming_status" DEFAULT 'draft',
  	"seo" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_upcoming_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_upcoming_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locations_id" integer
  );
  
  CREATE TABLE "_events_upcoming_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_start_date_time" timestamp(3) with time zone,
  	"version_end_date_time" timestamp(3) with time zone,
  	"version_description" varchar,
  	"version_image_id" integer,
  	"version_cta_label" varchar,
  	"version_cta_link" varchar,
  	"version_highlight" boolean DEFAULT false,
  	"version_priority" numeric DEFAULT 0,
  	"version_status" "enum__events_upcoming_v_version_status" DEFAULT 'draft',
  	"version_seo" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_upcoming_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_events_upcoming_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locations_id" integer
  );
  
  CREATE TABLE "deals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"label" varchar,
  	"short_text" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"image_id" integer,
  	"start_at" timestamp(3) with time zone,
  	"end_at" timestamp(3) with time zone,
  	"priority" numeric DEFAULT 0,
  	"placement_global_header" boolean DEFAULT false,
  	"placement_global_burger" boolean DEFAULT false,
  	"device_targeting" jsonb,
  	"status" "enum_deals_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_deals_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "deals_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"locations_id" integer
  );
  
  CREATE TABLE "_deals_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_label" varchar,
  	"version_short_text" varchar,
  	"version_cta_label" varchar,
  	"version_cta_url" varchar,
  	"version_image_id" integer,
  	"version_start_at" timestamp(3) with time zone,
  	"version_end_at" timestamp(3) with time zone,
  	"version_priority" numeric DEFAULT 0,
  	"version_placement_global_header" boolean DEFAULT false,
  	"version_placement_global_burger" boolean DEFAULT false,
  	"version_device_targeting" jsonb,
  	"version_status" "enum__deals_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__deals_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_deals_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"locations_id" integer
  );
  
  CREATE TABLE "campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_campaigns_type",
  	"headline" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"targeting_device" "enum_campaigns_targeting_device" DEFAULT 'all',
  	"timing_start_at" timestamp(3) with time zone,
  	"timing_end_at" timestamp(3) with time zone,
  	"timing_trigger" "enum_campaigns_timing_trigger" DEFAULT 'delay',
  	"timing_trigger_value" numeric DEFAULT 5,
  	"timing_frequency" jsonb,
  	"status" "enum_campaigns_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_campaigns_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "campaigns_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"locations_id" integer
  );
  
  CREATE TABLE "_campaigns_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_type" "enum__campaigns_v_version_type",
  	"version_headline" varchar,
  	"version_text" varchar,
  	"version_image_id" integer,
  	"version_cta_label" varchar,
  	"version_cta_url" varchar,
  	"version_targeting_device" "enum__campaigns_v_version_targeting_device" DEFAULT 'all',
  	"version_timing_start_at" timestamp(3) with time zone,
  	"version_timing_end_at" timestamp(3) with time zone,
  	"version_timing_trigger" "enum__campaigns_v_version_timing_trigger" DEFAULT 'delay',
  	"version_timing_trigger_value" numeric DEFAULT 5,
  	"version_timing_frequency" jsonb,
  	"version_status" "enum__campaigns_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__campaigns_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_campaigns_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"locations_id" integer
  );
  
  CREATE TABLE "forms_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"label" varchar,
  	"type" "enum_forms_fields_type",
  	"required" boolean DEFAULT false,
  	"options" jsonb,
  	"validation" jsonb
  );
  
  CREATE TABLE "forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"status" "enum_forms_status" DEFAULT 'draft',
  	"recipient_email" varchar,
  	"webhook_url" varchar,
  	"zendesk_mode" "enum_forms_zendesk_mode" DEFAULT 'none',
  	"prevo_enabled" boolean DEFAULT false,
  	"prevo_tag" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_forms_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "forms_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer
  );
  
  CREATE TABLE "_forms_v_version_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"label" varchar,
  	"type" "enum__forms_v_version_fields_type",
  	"required" boolean DEFAULT false,
  	"options" jsonb,
  	"validation" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_forms_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_status" "enum__forms_v_version_status" DEFAULT 'draft',
  	"version_recipient_email" varchar,
  	"version_webhook_url" varchar,
  	"version_zendesk_mode" "enum__forms_v_version_zendesk_mode" DEFAULT 'none',
  	"version_prevo_enabled" boolean DEFAULT false,
  	"version_prevo_tag" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__forms_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_forms_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_slug" varchar,
  	"email" varchar,
  	"name" varchar,
  	"phone" varchar,
  	"payload" jsonb,
  	"utm" jsonb,
  	"consent" jsonb,
  	"status" "enum_leads_status" DEFAULT 'new',
  	"integration_log" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"pages_id" integer,
  	"locations_id" integer,
  	"events_weekly_id" integer,
  	"events_upcoming_id" integer,
  	"deals_id" integer,
  	"campaigns_id" integer,
  	"forms_id" integer,
  	"leads_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "settings_seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_meta_title" varchar,
  	"default_meta_description" varchar,
  	"robots" varchar,
  	"sitemap_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_tracking" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ga4_measurement_id" varchar,
  	"meta_pixel_id" varchar,
  	"other_scripts" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"zendesk_inbound_email" varchar,
  	"zendesk_webhook_url" varchar,
  	"prevo_api_url" varchar,
  	"prevo_api_key" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_brand" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_menu_items" jsonb,
  	"header_cta_label" varchar,
  	"header_cta_url" varchar,
  	"footer_logo_text" varchar,
  	"footer_text" varchar,
  	"footer_links" jsonb,
  	"brand_name" varchar,
  	"brand_locations" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text" ADD CONSTRAINT "pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_deal_slot" ADD CONSTRAINT "pages_blocks_deal_slot_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_deal_slot" ADD CONSTRAINT "pages_blocks_deal_slot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_campaign_slot" ADD CONSTRAINT "pages_blocks_campaign_slot_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_campaign_slot" ADD CONSTRAINT "pages_blocks_campaign_slot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_weekly_events" ADD CONSTRAINT "pages_blocks_weekly_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_upcoming_events" ADD CONSTRAINT "pages_blocks_upcoming_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_embed" ADD CONSTRAINT "pages_blocks_form_embed_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_embed" ADD CONSTRAINT "pages_blocks_form_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text" ADD CONSTRAINT "_pages_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_deal_slot" ADD CONSTRAINT "_pages_v_blocks_deal_slot_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_deal_slot" ADD CONSTRAINT "_pages_v_blocks_deal_slot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_campaign_slot" ADD CONSTRAINT "_pages_v_blocks_campaign_slot_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_campaign_slot" ADD CONSTRAINT "_pages_v_blocks_campaign_slot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_weekly_events" ADD CONSTRAINT "_pages_v_blocks_weekly_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_upcoming_events" ADD CONSTRAINT "_pages_v_blocks_upcoming_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_embed" ADD CONSTRAINT "_pages_v_blocks_form_embed_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_embed" ADD CONSTRAINT "_pages_v_blocks_form_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_rels" ADD CONSTRAINT "locations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_weekly_weekdays" ADD CONSTRAINT "events_weekly_weekdays_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events_weekly"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_weekly" ADD CONSTRAINT "events_weekly_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_weekly_rels" ADD CONSTRAINT "events_weekly_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events_weekly"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_weekly_rels" ADD CONSTRAINT "events_weekly_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_upcoming" ADD CONSTRAINT "events_upcoming_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_upcoming_rels" ADD CONSTRAINT "events_upcoming_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events_upcoming"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_upcoming_rels" ADD CONSTRAINT "events_upcoming_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_upcoming_v" ADD CONSTRAINT "_events_upcoming_v_parent_id_events_upcoming_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events_upcoming"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_upcoming_v" ADD CONSTRAINT "_events_upcoming_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_upcoming_v_rels" ADD CONSTRAINT "_events_upcoming_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_upcoming_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_upcoming_v_rels" ADD CONSTRAINT "_events_upcoming_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deals" ADD CONSTRAINT "deals_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "deals_rels" ADD CONSTRAINT "deals_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deals_rels" ADD CONSTRAINT "deals_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deals_rels" ADD CONSTRAINT "deals_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deals_v" ADD CONSTRAINT "_deals_v_parent_id_deals_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deals_v" ADD CONSTRAINT "_deals_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deals_v_rels" ADD CONSTRAINT "_deals_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_deals_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deals_v_rels" ADD CONSTRAINT "_deals_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deals_v_rels" ADD CONSTRAINT "_deals_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "campaigns_rels" ADD CONSTRAINT "campaigns_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campaigns_rels" ADD CONSTRAINT "campaigns_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "campaigns_rels" ADD CONSTRAINT "campaigns_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_campaigns_v" ADD CONSTRAINT "_campaigns_v_parent_id_campaigns_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_campaigns_v" ADD CONSTRAINT "_campaigns_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_campaigns_v_rels" ADD CONSTRAINT "_campaigns_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_campaigns_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_campaigns_v_rels" ADD CONSTRAINT "_campaigns_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_campaigns_v_rels" ADD CONSTRAINT "_campaigns_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_fields" ADD CONSTRAINT "forms_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_version_fields" ADD CONSTRAINT "_forms_v_version_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_forms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v" ADD CONSTRAINT "_forms_v_parent_id_forms_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_forms_v_rels" ADD CONSTRAINT "_forms_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_forms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_forms_v_rels" ADD CONSTRAINT "_forms_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_weekly_fk" FOREIGN KEY ("events_weekly_id") REFERENCES "public"."events_weekly"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_upcoming_fk" FOREIGN KEY ("events_upcoming_id") REFERENCES "public"."events_upcoming"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deals_fk" FOREIGN KEY ("deals_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaigns_fk" FOREIGN KEY ("campaigns_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_image_idx" ON "pages_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "pages_blocks_text_order_idx" ON "pages_blocks_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_parent_id_idx" ON "pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_path_idx" ON "pages_blocks_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_deal_slot_order_idx" ON "pages_blocks_deal_slot" USING btree ("_order");
  CREATE INDEX "pages_blocks_deal_slot_parent_id_idx" ON "pages_blocks_deal_slot" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_deal_slot_path_idx" ON "pages_blocks_deal_slot" USING btree ("_path");
  CREATE INDEX "pages_blocks_deal_slot_deal_idx" ON "pages_blocks_deal_slot" USING btree ("deal_id");
  CREATE INDEX "pages_blocks_campaign_slot_order_idx" ON "pages_blocks_campaign_slot" USING btree ("_order");
  CREATE INDEX "pages_blocks_campaign_slot_parent_id_idx" ON "pages_blocks_campaign_slot" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_campaign_slot_path_idx" ON "pages_blocks_campaign_slot" USING btree ("_path");
  CREATE INDEX "pages_blocks_campaign_slot_campaign_idx" ON "pages_blocks_campaign_slot" USING btree ("campaign_id");
  CREATE INDEX "pages_blocks_weekly_events_order_idx" ON "pages_blocks_weekly_events" USING btree ("_order");
  CREATE INDEX "pages_blocks_weekly_events_parent_id_idx" ON "pages_blocks_weekly_events" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_weekly_events_path_idx" ON "pages_blocks_weekly_events" USING btree ("_path");
  CREATE INDEX "pages_blocks_upcoming_events_order_idx" ON "pages_blocks_upcoming_events" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_events_parent_id_idx" ON "pages_blocks_upcoming_events" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_events_path_idx" ON "pages_blocks_upcoming_events" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_embed_order_idx" ON "pages_blocks_form_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_embed_parent_id_idx" ON "pages_blocks_form_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_embed_path_idx" ON "pages_blocks_form_embed" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_embed_form_idx" ON "pages_blocks_form_embed" USING btree ("form_id");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_background_image_idx" ON "_pages_v_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "_pages_v_blocks_text_order_idx" ON "_pages_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_parent_id_idx" ON "_pages_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_path_idx" ON "_pages_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_deal_slot_order_idx" ON "_pages_v_blocks_deal_slot" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_deal_slot_parent_id_idx" ON "_pages_v_blocks_deal_slot" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_deal_slot_path_idx" ON "_pages_v_blocks_deal_slot" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_deal_slot_deal_idx" ON "_pages_v_blocks_deal_slot" USING btree ("deal_id");
  CREATE INDEX "_pages_v_blocks_campaign_slot_order_idx" ON "_pages_v_blocks_campaign_slot" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_campaign_slot_parent_id_idx" ON "_pages_v_blocks_campaign_slot" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_campaign_slot_path_idx" ON "_pages_v_blocks_campaign_slot" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_campaign_slot_campaign_idx" ON "_pages_v_blocks_campaign_slot" USING btree ("campaign_id");
  CREATE INDEX "_pages_v_blocks_weekly_events_order_idx" ON "_pages_v_blocks_weekly_events" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_weekly_events_parent_id_idx" ON "_pages_v_blocks_weekly_events" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_weekly_events_path_idx" ON "_pages_v_blocks_weekly_events" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_upcoming_events_order_idx" ON "_pages_v_blocks_upcoming_events" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_upcoming_events_parent_id_idx" ON "_pages_v_blocks_upcoming_events" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_upcoming_events_path_idx" ON "_pages_v_blocks_upcoming_events" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_embed_order_idx" ON "_pages_v_blocks_form_embed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_embed_parent_id_idx" ON "_pages_v_blocks_form_embed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_embed_path_idx" ON "_pages_v_blocks_form_embed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_embed_form_idx" ON "_pages_v_blocks_form_embed" USING btree ("form_id");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE INDEX "locations_rels_order_idx" ON "locations_rels" USING btree ("order");
  CREATE INDEX "locations_rels_parent_idx" ON "locations_rels" USING btree ("parent_id");
  CREATE INDEX "locations_rels_path_idx" ON "locations_rels" USING btree ("path");
  CREATE INDEX "locations_rels_media_id_idx" ON "locations_rels" USING btree ("media_id");
  CREATE INDEX "events_weekly_weekdays_order_idx" ON "events_weekly_weekdays" USING btree ("order");
  CREATE INDEX "events_weekly_weekdays_parent_idx" ON "events_weekly_weekdays" USING btree ("parent_id");
  CREATE UNIQUE INDEX "events_weekly_slug_idx" ON "events_weekly" USING btree ("slug");
  CREATE INDEX "events_weekly_image_idx" ON "events_weekly" USING btree ("image_id");
  CREATE INDEX "events_weekly_updated_at_idx" ON "events_weekly" USING btree ("updated_at");
  CREATE INDEX "events_weekly_created_at_idx" ON "events_weekly" USING btree ("created_at");
  CREATE INDEX "events_weekly_rels_order_idx" ON "events_weekly_rels" USING btree ("order");
  CREATE INDEX "events_weekly_rels_parent_idx" ON "events_weekly_rels" USING btree ("parent_id");
  CREATE INDEX "events_weekly_rels_path_idx" ON "events_weekly_rels" USING btree ("path");
  CREATE INDEX "events_weekly_rels_locations_id_idx" ON "events_weekly_rels" USING btree ("locations_id");
  CREATE UNIQUE INDEX "events_upcoming_slug_idx" ON "events_upcoming" USING btree ("slug");
  CREATE INDEX "events_upcoming_image_idx" ON "events_upcoming" USING btree ("image_id");
  CREATE INDEX "events_upcoming_updated_at_idx" ON "events_upcoming" USING btree ("updated_at");
  CREATE INDEX "events_upcoming_created_at_idx" ON "events_upcoming" USING btree ("created_at");
  CREATE INDEX "events_upcoming__status_idx" ON "events_upcoming" USING btree ("_status");
  CREATE INDEX "events_upcoming_rels_order_idx" ON "events_upcoming_rels" USING btree ("order");
  CREATE INDEX "events_upcoming_rels_parent_idx" ON "events_upcoming_rels" USING btree ("parent_id");
  CREATE INDEX "events_upcoming_rels_path_idx" ON "events_upcoming_rels" USING btree ("path");
  CREATE INDEX "events_upcoming_rels_locations_id_idx" ON "events_upcoming_rels" USING btree ("locations_id");
  CREATE INDEX "_events_upcoming_v_parent_idx" ON "_events_upcoming_v" USING btree ("parent_id");
  CREATE INDEX "_events_upcoming_v_version_version_slug_idx" ON "_events_upcoming_v" USING btree ("version_slug");
  CREATE INDEX "_events_upcoming_v_version_version_image_idx" ON "_events_upcoming_v" USING btree ("version_image_id");
  CREATE INDEX "_events_upcoming_v_version_version_updated_at_idx" ON "_events_upcoming_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_upcoming_v_version_version_created_at_idx" ON "_events_upcoming_v" USING btree ("version_created_at");
  CREATE INDEX "_events_upcoming_v_version_version__status_idx" ON "_events_upcoming_v" USING btree ("version__status");
  CREATE INDEX "_events_upcoming_v_created_at_idx" ON "_events_upcoming_v" USING btree ("created_at");
  CREATE INDEX "_events_upcoming_v_updated_at_idx" ON "_events_upcoming_v" USING btree ("updated_at");
  CREATE INDEX "_events_upcoming_v_latest_idx" ON "_events_upcoming_v" USING btree ("latest");
  CREATE INDEX "_events_upcoming_v_rels_order_idx" ON "_events_upcoming_v_rels" USING btree ("order");
  CREATE INDEX "_events_upcoming_v_rels_parent_idx" ON "_events_upcoming_v_rels" USING btree ("parent_id");
  CREATE INDEX "_events_upcoming_v_rels_path_idx" ON "_events_upcoming_v_rels" USING btree ("path");
  CREATE INDEX "_events_upcoming_v_rels_locations_id_idx" ON "_events_upcoming_v_rels" USING btree ("locations_id");
  CREATE INDEX "deals_image_idx" ON "deals" USING btree ("image_id");
  CREATE INDEX "deals_updated_at_idx" ON "deals" USING btree ("updated_at");
  CREATE INDEX "deals_created_at_idx" ON "deals" USING btree ("created_at");
  CREATE INDEX "deals__status_idx" ON "deals" USING btree ("_status");
  CREATE INDEX "deals_rels_order_idx" ON "deals_rels" USING btree ("order");
  CREATE INDEX "deals_rels_parent_idx" ON "deals_rels" USING btree ("parent_id");
  CREATE INDEX "deals_rels_path_idx" ON "deals_rels" USING btree ("path");
  CREATE INDEX "deals_rels_pages_id_idx" ON "deals_rels" USING btree ("pages_id");
  CREATE INDEX "deals_rels_locations_id_idx" ON "deals_rels" USING btree ("locations_id");
  CREATE INDEX "_deals_v_parent_idx" ON "_deals_v" USING btree ("parent_id");
  CREATE INDEX "_deals_v_version_version_image_idx" ON "_deals_v" USING btree ("version_image_id");
  CREATE INDEX "_deals_v_version_version_updated_at_idx" ON "_deals_v" USING btree ("version_updated_at");
  CREATE INDEX "_deals_v_version_version_created_at_idx" ON "_deals_v" USING btree ("version_created_at");
  CREATE INDEX "_deals_v_version_version__status_idx" ON "_deals_v" USING btree ("version__status");
  CREATE INDEX "_deals_v_created_at_idx" ON "_deals_v" USING btree ("created_at");
  CREATE INDEX "_deals_v_updated_at_idx" ON "_deals_v" USING btree ("updated_at");
  CREATE INDEX "_deals_v_latest_idx" ON "_deals_v" USING btree ("latest");
  CREATE INDEX "_deals_v_rels_order_idx" ON "_deals_v_rels" USING btree ("order");
  CREATE INDEX "_deals_v_rels_parent_idx" ON "_deals_v_rels" USING btree ("parent_id");
  CREATE INDEX "_deals_v_rels_path_idx" ON "_deals_v_rels" USING btree ("path");
  CREATE INDEX "_deals_v_rels_pages_id_idx" ON "_deals_v_rels" USING btree ("pages_id");
  CREATE INDEX "_deals_v_rels_locations_id_idx" ON "_deals_v_rels" USING btree ("locations_id");
  CREATE INDEX "campaigns_image_idx" ON "campaigns" USING btree ("image_id");
  CREATE INDEX "campaigns_updated_at_idx" ON "campaigns" USING btree ("updated_at");
  CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");
  CREATE INDEX "campaigns__status_idx" ON "campaigns" USING btree ("_status");
  CREATE INDEX "campaigns_rels_order_idx" ON "campaigns_rels" USING btree ("order");
  CREATE INDEX "campaigns_rels_parent_idx" ON "campaigns_rels" USING btree ("parent_id");
  CREATE INDEX "campaigns_rels_path_idx" ON "campaigns_rels" USING btree ("path");
  CREATE INDEX "campaigns_rels_pages_id_idx" ON "campaigns_rels" USING btree ("pages_id");
  CREATE INDEX "campaigns_rels_locations_id_idx" ON "campaigns_rels" USING btree ("locations_id");
  CREATE INDEX "_campaigns_v_parent_idx" ON "_campaigns_v" USING btree ("parent_id");
  CREATE INDEX "_campaigns_v_version_version_image_idx" ON "_campaigns_v" USING btree ("version_image_id");
  CREATE INDEX "_campaigns_v_version_version_updated_at_idx" ON "_campaigns_v" USING btree ("version_updated_at");
  CREATE INDEX "_campaigns_v_version_version_created_at_idx" ON "_campaigns_v" USING btree ("version_created_at");
  CREATE INDEX "_campaigns_v_version_version__status_idx" ON "_campaigns_v" USING btree ("version__status");
  CREATE INDEX "_campaigns_v_created_at_idx" ON "_campaigns_v" USING btree ("created_at");
  CREATE INDEX "_campaigns_v_updated_at_idx" ON "_campaigns_v" USING btree ("updated_at");
  CREATE INDEX "_campaigns_v_latest_idx" ON "_campaigns_v" USING btree ("latest");
  CREATE INDEX "_campaigns_v_rels_order_idx" ON "_campaigns_v_rels" USING btree ("order");
  CREATE INDEX "_campaigns_v_rels_parent_idx" ON "_campaigns_v_rels" USING btree ("parent_id");
  CREATE INDEX "_campaigns_v_rels_path_idx" ON "_campaigns_v_rels" USING btree ("path");
  CREATE INDEX "_campaigns_v_rels_pages_id_idx" ON "_campaigns_v_rels" USING btree ("pages_id");
  CREATE INDEX "_campaigns_v_rels_locations_id_idx" ON "_campaigns_v_rels" USING btree ("locations_id");
  CREATE INDEX "forms_fields_order_idx" ON "forms_fields" USING btree ("_order");
  CREATE INDEX "forms_fields_parent_id_idx" ON "forms_fields" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "forms_slug_idx" ON "forms" USING btree ("slug");
  CREATE INDEX "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE INDEX "forms_created_at_idx" ON "forms" USING btree ("created_at");
  CREATE INDEX "forms__status_idx" ON "forms" USING btree ("_status");
  CREATE INDEX "forms_rels_order_idx" ON "forms_rels" USING btree ("order");
  CREATE INDEX "forms_rels_parent_idx" ON "forms_rels" USING btree ("parent_id");
  CREATE INDEX "forms_rels_path_idx" ON "forms_rels" USING btree ("path");
  CREATE INDEX "forms_rels_pages_id_idx" ON "forms_rels" USING btree ("pages_id");
  CREATE INDEX "_forms_v_version_fields_order_idx" ON "_forms_v_version_fields" USING btree ("_order");
  CREATE INDEX "_forms_v_version_fields_parent_id_idx" ON "_forms_v_version_fields" USING btree ("_parent_id");
  CREATE INDEX "_forms_v_parent_idx" ON "_forms_v" USING btree ("parent_id");
  CREATE INDEX "_forms_v_version_version_slug_idx" ON "_forms_v" USING btree ("version_slug");
  CREATE INDEX "_forms_v_version_version_updated_at_idx" ON "_forms_v" USING btree ("version_updated_at");
  CREATE INDEX "_forms_v_version_version_created_at_idx" ON "_forms_v" USING btree ("version_created_at");
  CREATE INDEX "_forms_v_version_version__status_idx" ON "_forms_v" USING btree ("version__status");
  CREATE INDEX "_forms_v_created_at_idx" ON "_forms_v" USING btree ("created_at");
  CREATE INDEX "_forms_v_updated_at_idx" ON "_forms_v" USING btree ("updated_at");
  CREATE INDEX "_forms_v_latest_idx" ON "_forms_v" USING btree ("latest");
  CREATE INDEX "_forms_v_rels_order_idx" ON "_forms_v_rels" USING btree ("order");
  CREATE INDEX "_forms_v_rels_parent_idx" ON "_forms_v_rels" USING btree ("parent_id");
  CREATE INDEX "_forms_v_rels_path_idx" ON "_forms_v_rels" USING btree ("path");
  CREATE INDEX "_forms_v_rels_pages_id_idx" ON "_forms_v_rels" USING btree ("pages_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");
  CREATE INDEX "payload_locked_documents_rels_events_weekly_id_idx" ON "payload_locked_documents_rels" USING btree ("events_weekly_id");
  CREATE INDEX "payload_locked_documents_rels_events_upcoming_id_idx" ON "payload_locked_documents_rels" USING btree ("events_upcoming_id");
  CREATE INDEX "payload_locked_documents_rels_deals_id_idx" ON "payload_locked_documents_rels" USING btree ("deals_id");
  CREATE INDEX "payload_locked_documents_rels_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_text" CASCADE;
  DROP TABLE "pages_blocks_deal_slot" CASCADE;
  DROP TABLE "pages_blocks_campaign_slot" CASCADE;
  DROP TABLE "pages_blocks_weekly_events" CASCADE;
  DROP TABLE "pages_blocks_upcoming_events" CASCADE;
  DROP TABLE "pages_blocks_form_embed" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_text" CASCADE;
  DROP TABLE "_pages_v_blocks_deal_slot" CASCADE;
  DROP TABLE "_pages_v_blocks_campaign_slot" CASCADE;
  DROP TABLE "_pages_v_blocks_weekly_events" CASCADE;
  DROP TABLE "_pages_v_blocks_upcoming_events" CASCADE;
  DROP TABLE "_pages_v_blocks_form_embed" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "locations_rels" CASCADE;
  DROP TABLE "events_weekly_weekdays" CASCADE;
  DROP TABLE "events_weekly" CASCADE;
  DROP TABLE "events_weekly_rels" CASCADE;
  DROP TABLE "events_upcoming" CASCADE;
  DROP TABLE "events_upcoming_rels" CASCADE;
  DROP TABLE "_events_upcoming_v" CASCADE;
  DROP TABLE "_events_upcoming_v_rels" CASCADE;
  DROP TABLE "deals" CASCADE;
  DROP TABLE "deals_rels" CASCADE;
  DROP TABLE "_deals_v" CASCADE;
  DROP TABLE "_deals_v_rels" CASCADE;
  DROP TABLE "campaigns" CASCADE;
  DROP TABLE "campaigns_rels" CASCADE;
  DROP TABLE "_campaigns_v" CASCADE;
  DROP TABLE "_campaigns_v_rels" CASCADE;
  DROP TABLE "forms_fields" CASCADE;
  DROP TABLE "forms" CASCADE;
  DROP TABLE "forms_rels" CASCADE;
  DROP TABLE "_forms_v_version_fields" CASCADE;
  DROP TABLE "_forms_v" CASCADE;
  DROP TABLE "_forms_v_rels" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "settings_seo" CASCADE;
  DROP TABLE "settings_tracking" CASCADE;
  DROP TABLE "settings_integrations" CASCADE;
  DROP TABLE "settings_brand" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_pages_blocks_deal_slot_mode";
  DROP TYPE "public"."enum_pages_blocks_deal_slot_show_on";
  DROP TYPE "public"."enum_pages_blocks_campaign_slot_render_mode";
  DROP TYPE "public"."enum_pages_blocks_form_embed_layout";
  DROP TYPE "public"."enum_pages_page_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_deal_slot_mode";
  DROP TYPE "public"."enum__pages_v_blocks_deal_slot_show_on";
  DROP TYPE "public"."enum__pages_v_blocks_campaign_slot_render_mode";
  DROP TYPE "public"."enum__pages_v_blocks_form_embed_layout";
  DROP TYPE "public"."enum__pages_v_version_page_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_events_weekly_weekdays";
  DROP TYPE "public"."enum_events_weekly_status";
  DROP TYPE "public"."enum_events_upcoming_status";
  DROP TYPE "public"."enum__events_upcoming_v_version_status";
  DROP TYPE "public"."enum_deals_status";
  DROP TYPE "public"."enum__deals_v_version_status";
  DROP TYPE "public"."enum_campaigns_type";
  DROP TYPE "public"."enum_campaigns_targeting_device";
  DROP TYPE "public"."enum_campaigns_timing_trigger";
  DROP TYPE "public"."enum_campaigns_status";
  DROP TYPE "public"."enum__campaigns_v_version_type";
  DROP TYPE "public"."enum__campaigns_v_version_targeting_device";
  DROP TYPE "public"."enum__campaigns_v_version_timing_trigger";
  DROP TYPE "public"."enum__campaigns_v_version_status";
  DROP TYPE "public"."enum_forms_fields_type";
  DROP TYPE "public"."enum_forms_status";
  DROP TYPE "public"."enum_forms_zendesk_mode";
  DROP TYPE "public"."enum__forms_v_version_fields_type";
  DROP TYPE "public"."enum__forms_v_version_status";
  DROP TYPE "public"."enum__forms_v_version_zendesk_mode";
  DROP TYPE "public"."enum_leads_status";`)
}
