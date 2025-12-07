/**
 * Simple database layer for storing scheduled posts
 * 
 * For production, replace this with a proper database (PostgreSQL, MongoDB, etc.)
 * This implementation uses JSON file storage for simplicity
 */

import { AdPost } from "./types";
import { promises as fs } from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "scheduled-posts.json");

interface ScheduledPost extends AdPost {
  strategyId?: string;
  createdAt: string;
  postedAt?: string;
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  const dataDir = path.dirname(DB_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Read all scheduled posts from storage
 */
export async function getAllScheduledPosts(): Promise<ScheduledPost[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Save a scheduled post
 */
export async function saveScheduledPost(post: ScheduledPost): Promise<void> {
  await ensureDataDir();
  const posts = await getAllScheduledPosts();
  
  // Check if post already exists (by id)
  const existingIndex = posts.findIndex((p) => p.id === post.id);
  
  if (existingIndex >= 0) {
    // Update existing post
    posts[existingIndex] = post;
  } else {
    // Add new post
    posts.push(post);
  }
  
  await fs.writeFile(DB_FILE, JSON.stringify(posts, null, 2), "utf-8");
}

/**
 * Get posts that are due to be posted (scheduledTime <= now and status !== "posted")
 */
export async function getDuePosts(): Promise<ScheduledPost[]> {
  const posts = await getAllScheduledPosts();
  const now = new Date().toISOString();
  
  return posts.filter(
    (post) =>
      post.scheduledTime <= now &&
      post.status !== "posted" &&
      post.content // Must have content to post
  );
}

/**
 * Update post status
 */
export async function updatePostStatus(
  postId: string,
  status: "draft" | "generated" | "posted",
  postedAt?: string
): Promise<void> {
  const posts = await getAllScheduledPosts();
  const post = posts.find((p) => p.id === postId);
  
  if (post) {
    post.status = status;
    if (postedAt) {
      (post as ScheduledPost).postedAt = postedAt;
    }
    await saveScheduledPost(post as ScheduledPost);
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(postId: string): Promise<void> {
  const posts = await getAllScheduledPosts();
  const filtered = posts.filter((p) => p.id !== postId);
  await fs.writeFile(DB_FILE, JSON.stringify(filtered, null, 2), "utf-8");
}

/**
 * Clear all scheduled posts
 */
export async function clearAllPosts(): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_FILE, JSON.stringify([], null, 2), "utf-8");
}
