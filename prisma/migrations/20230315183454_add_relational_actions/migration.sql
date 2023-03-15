-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_assets_id_fk";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_users_id_fk";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_users_id_fk";

-- DropForeignKey
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_people_id_fk";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_categories_id_fk";

-- DropForeignKey
ALTER TABLE "credits" DROP CONSTRAINT "credits_people_id_fk";

-- DropForeignKey
ALTER TABLE "credits" DROP CONSTRAINT "credits_productions_id_fk";

-- DropForeignKey
ALTER TABLE "group_permissions" DROP CONSTRAINT "group_permissions_groups_id_fk";

-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_groups_id_fk";

-- DropForeignKey
ALTER TABLE "people_images" DROP CONSTRAINT "people_images_images_id_fk";

-- DropForeignKey
ALTER TABLE "people_images" DROP CONSTRAINT "people_images_people_id_fk";

-- DropForeignKey
ALTER TABLE "people_roles" DROP CONSTRAINT "people_roles_people_id_fk";

-- DropForeignKey
ALTER TABLE "people_roles" DROP CONSTRAINT "people_roles_roles_id_fk";

-- DropForeignKey
ALTER TABLE "production_images" DROP CONSTRAINT "production_images_images_id_fk";

-- DropForeignKey
ALTER TABLE "production_images" DROP CONSTRAINT "production_images_productions_id_fk";

-- DropForeignKey
ALTER TABLE "production_rsvps" DROP CONSTRAINT "production_rsvps_productions_id_fk";

-- DropForeignKey
ALTER TABLE "production_rsvps" DROP CONSTRAINT "production_rsvps_users_id_fk";

-- DropForeignKey
ALTER TABLE "production_tags" DROP CONSTRAINT "production_tags_productions_id_fk";

-- DropForeignKey
ALTER TABLE "production_videos" DROP CONSTRAINT "production_videos_productions_id_fk";

-- DropForeignKey
ALTER TABLE "production_videos" DROP CONSTRAINT "production_videos_videos_id_fk";

-- DropForeignKey
ALTER TABLE "productions" DROP CONSTRAINT "productions_categories_id_fk";

-- DropForeignKey
ALTER TABLE "productions" DROP CONSTRAINT "productions_images_id_fk";

-- DropForeignKey
ALTER TABLE "user_groups" DROP CONSTRAINT "user_groups_groups_id_fk";

-- DropForeignKey
ALTER TABLE "user_groups" DROP CONSTRAINT "user_groups_users_id_fk";

-- DropForeignKey
ALTER TABLE "user_permissions" DROP CONSTRAINT "user_permissions_users_id_fk";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_people_id_fk";

-- DropForeignKey
ALTER TABLE "vote_responses" DROP CONSTRAINT "vote_responses_users_id_fk";

-- DropForeignKey
ALTER TABLE "vote_responses" DROP CONSTRAINT "vote_responses_votes_id_fk";

-- AlterTable
ALTER TABLE "blog_posts" ALTER COLUMN "author" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_users_id_fk" FOREIGN KEY ("last_known_handler") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_assets_id_fk" FOREIGN KEY ("parent") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_users_id_fk" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_people_id_fk" FOREIGN KEY ("author") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_categories_id_fk" FOREIGN KEY ("parent") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_people_id_fk" FOREIGN KEY ("person") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_productions_id_fk" FOREIGN KEY ("production") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_groups_id_fk" FOREIGN KEY ("parent") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_groups_id_fk" FOREIGN KEY ("group") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_images" ADD CONSTRAINT "people_images_images_id_fk" FOREIGN KEY ("image") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_images" ADD CONSTRAINT "people_images_people_id_fk" FOREIGN KEY ("person") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_roles" ADD CONSTRAINT "people_roles_people_id_fk" FOREIGN KEY ("person") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people_roles" ADD CONSTRAINT "people_roles_roles_id_fk" FOREIGN KEY ("role") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_categories_id_fk" FOREIGN KEY ("category") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productions" ADD CONSTRAINT "productions_images_id_fk" FOREIGN KEY ("thumbnail") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_images" ADD CONSTRAINT "production_images_images_id_fk" FOREIGN KEY ("image") REFERENCES "images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_images" ADD CONSTRAINT "production_images_productions_id_fk" FOREIGN KEY ("production") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_rsvps" ADD CONSTRAINT "production_rsvps_productions_id_fk" FOREIGN KEY ("production") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_rsvps" ADD CONSTRAINT "production_rsvps_users_id_fk" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tags" ADD CONSTRAINT "production_tags_productions_id_fk" FOREIGN KEY ("production") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_videos" ADD CONSTRAINT "production_videos_productions_id_fk" FOREIGN KEY ("production") REFERENCES "productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_videos" ADD CONSTRAINT "production_videos_videos_id_fk" FOREIGN KEY ("video") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_people_id_fk" FOREIGN KEY ("person") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groups_id_fk" FOREIGN KEY ("group") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_users_id_fk" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_users_id_fk" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_responses" ADD CONSTRAINT "vote_responses_users_id_fk" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_responses" ADD CONSTRAINT "vote_responses_votes_id_fk" FOREIGN KEY ("vote") REFERENCES "votes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
