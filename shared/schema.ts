import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  bio: text("bio"),
  title: text("title"),
  image: text("image").notNull(),
  distance: integer("distance"),
  tags: text("tags").array(),
  // New fields for the rating system
  score: numeric("score").notNull().default("100"), // Default starting score
  likesReceived: integer("likes_received").notNull().default(0),
  dislikesReceived: integer("dislikes_received").notNull().default(0),
  creditsRemaining: integer("credits_remaining").notNull().default(10), // Daily credits
  lastCreditReset: timestamp("last_credit_reset").defaultNow().notNull(), // When credits were last reset
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  title: text("title"),
  image: text("image").notNull(),
  distance: integer("distance"),
  tags: text("tags").array(),
});

export const swipes = pgTable("swipes", {
  id: serial("id").primaryKey(),
  swiperId: integer("swiper_id").notNull().references(() => users.id),
  swipedId: integer("swiped_id").notNull().references(() => users.id),
  liked: boolean("liked").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users);
// Create a version with only the fields we want to allow for inserts
export const userInsertFields = insertUserSchema.pick({
  username: true,
  password: true,
  name: true,
  age: true,
  bio: true,
  title: true,
  image: true,
  distance: true,
  tags: true,
});

export const insertSwipeSchema = createInsertSchema(swipes).pick({
  swiperId: true,
  swipedId: true,
  liked: true,
});

export type InsertSwipe = z.infer<typeof insertSwipeSchema>;

export const insertMessageSchema = createInsertSchema(messages).pick({
  matchId: true,
  senderId: true,
  receiverId: true,
  content: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Types
export type InsertUser = z.infer<typeof userInsertFields>;
export type User = typeof users.$inferSelect;
export type Swipe = typeof swipes.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Message = typeof messages.$inferSelect;
