import { PrismaClient } from '@prisma/client';

async function setupSql() {
  const prisma = new PrismaClient();
  
  const commands = [
    `CREATE OR REPLACE FUNCTION get_forum_posts(
      p_forum_id TEXT,
      p_user_id TEXT,
      p_page INT DEFAULT 1,
      p_limit INT DEFAULT 20
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_uni_id TEXT;
      v_forum_type TEXT;
      v_is_member BOOLEAN;
      v_result JSONB;
    BEGIN
      -- 1. Security & Context Checks
      SELECT "universityId" INTO v_uni_id FROM "User" WHERE id = p_user_id;
      SELECT type, "universityId" INTO v_forum_type, v_uni_id FROM "Forum" WHERE id = p_forum_id;
      
      IF v_forum_type = 'PRIVATE' THEN
        SELECT EXISTS(SELECT 1 FROM "PrivateForumMember" WHERE "forumId" = p_forum_id AND "userId" = p_user_id) INTO v_is_member;
        IF NOT v_is_member THEN
          RETURN jsonb_build_object('error', 'Forbidden', 'status', 403);
        END IF;
      END IF;

      -- 2. Fetch Posts
      WITH post_data AS (
        SELECT 
          p.id,
          p.content,
          p."imageUrl",
          p.attachments,
          p."interactionsDisabled",
          p."authorId",
          p."forumId",
          p."createdAt",
          p."updatedAt",
          p."expiresAt",
          p."isPinned",
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'image', u."image",
            'handle', u.handle,
            'rank', (SELECT jsonb_build_object('label', r.label, 'badge', r.badge) FROM "Rank" r WHERE r.id = u."rankId")
          ) as author,
          (SELECT count(*) FROM "Like" l WHERE l."postId" = p.id) as likes_count,
          (SELECT count(*) FROM "Comment" c WHERE c."postId" = p.id) as comments_count,
          EXISTS(SELECT 1 FROM "Like" l WHERE l."postId" = p.id AND l."userId" = p_user_id) as liked_by_me,
          (SELECT count(*) FROM "Like" l JOIN "Post" lp ON l."postId" = lp.id WHERE l."userId" = p_user_id AND lp."authorId" = p."authorId") as affinity_score
        FROM "Post" p
        JOIN "User" u ON p."authorId" = u.id
        WHERE p."forumId" = p_forum_id
          AND (p."expiresAt" IS NULL OR p."expiresAt" > NOW() OR p."isPinned" = true)
        ORDER BY p."isPinned" DESC, affinity_score DESC, p."createdAt" DESC
        LIMIT p_limit
        OFFSET (p_page - 1) * p_limit
      )
      SELECT jsonb_agg(to_jsonb(post_data)) INTO v_result FROM post_data;

      RETURN COALESCE(v_result, '[]'::jsonb);
    END;
    $$;`,
    `CREATE OR REPLACE FUNCTION get_trending_tags()
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_result JSONB;
    BEGIN
      WITH tag_data AS (
        SELECT id, name, count
        FROM "Hashtag"
        ORDER BY count DESC
        LIMIT 10
      )
      SELECT jsonb_agg(to_jsonb(tag_data)) INTO v_result FROM tag_data;
      RETURN COALESCE(v_result, '[]'::jsonb);
    END;
    $$;`
  ];

  try {
    console.log("🚀 Creating high-performance SQL functions in Supabase...");
    for (const cmd of commands) {
      await prisma.$executeRawUnsafe(cmd);
    }
    console.log("✅ SQL functions created successfully!");
  } catch (error) {
    console.error("❌ Failed to create SQL function:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSql();
