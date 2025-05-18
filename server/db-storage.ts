import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db';
import {
  users, type User, type InsertUser,
  swipes, type Swipe, type InsertSwipe,
  matches, type Match,
  messages, type Message, type InsertMessage
} from '@shared/schema';
import { IStorage } from './storage';

export class DbStorage implements IStorage {
  private DEFAULT_DAILY_CREDITS = 50;
  private SCORE_INCREASE_ON_LIKE = 2;
  private SCORE_DECREASE_ON_DISLIKE = 1;
  private MILLISEC_IN_DAY = 24 * 60 * 60 * 1000;

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      score: "100",
      likesReceived: 0,
      dislikesReceived: 0,
      creditsRemaining: this.DEFAULT_DAILY_CREDITS,
      lastCreditReset: new Date()
    }).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersForSwiping(userId: number): Promise<User[]> {
    // Get IDs of already swiped users
    const swipedUsers = await db.select({
      swipedId: swipes.swipedId
    }).from(swipes).where(eq(swipes.swiperId, userId));
    
    const swipedIds = swipedUsers.map(swipe => swipe.swipedId);
    
    // Add the user's own ID to the filter
    swipedIds.push(userId);
    
    // Find all users not in the swiped list
    const result = await db.select()
      .from(users)
      .where(
        sql`${users.id} NOT IN (${swipedIds.join(',')})`
      )
      .orderBy(desc(users.score));
    
    return result;
  }

  // Credit system and scoring operations
  async updateUserScore(userId: number, newScore: number): Promise<User> {
    const result = await db.update(users)
      .set({ score: newScore.toString() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async incrementLikesReceived(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentScore = parseFloat(user.score);
    const newScore = currentScore + this.SCORE_INCREASE_ON_LIKE;
    
    const result = await db.update(users)
      .set({
        likesReceived: (user.likesReceived || 0) + 1,
        score: newScore.toString()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async incrementDislikesReceived(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentScore = parseFloat(user.score);
    const newScore = Math.max(currentScore - this.SCORE_DECREASE_ON_DISLIKE, 10); // Minimum score of 10
    
    const result = await db.update(users)
      .set({
        dislikesReceived: (user.dislikesReceived || 0) + 1,
        score: newScore.toString()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async resetDailyCredits(userId: number, credits = this.DEFAULT_DAILY_CREDITS): Promise<User> {
    const result = await db.update(users)
      .set({
        creditsRemaining: credits,
        lastCreditReset: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async checkAndResetCreditsIfNeeded(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);
    const timeSinceReset = now.getTime() - lastReset.getTime();
    
    if (timeSinceReset >= this.MILLISEC_IN_DAY) {
      // It's been at least 24 hours, reset credits
      return this.resetDailyCredits(userId);
    }
    
    return user;
  }

  async decrementCredits(userId: number): Promise<User> {
    // Ensure we've checked for daily reset before decrementing
    await this.checkAndResetCreditsIfNeeded(userId);
    
    // Get the latest user state after possible reset
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Decrement credits, don't go below 0
    const newCredits = Math.max((user.creditsRemaining || 0) - 1, 0);
    
    const result = await db.update(users)
      .set({ creditsRemaining: newCredits })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
  }

  async getRemainingCredits(userId: number): Promise<number> {
    // Check if we need to reset first
    const user = await this.checkAndResetCreditsIfNeeded(userId);
    return user.creditsRemaining || 0;
  }

  // Swipe operations
  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    const result = await db.insert(swipes)
      .values({
        ...swipe,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async getSwipe(swiperId: number, swipedId: number): Promise<Swipe | undefined> {
    const result = await db.select()
      .from(swipes)
      .where(
        and(
          eq(swipes.swiperId, swiperId),
          eq(swipes.swipedId, swipedId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  // Match operations
  async createMatch(user1Id: number, user2Id: number): Promise<Match> {
    const result = await db.insert(matches)
      .values({
        user1Id, 
        user2Id,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async getMatches(userId: number): Promise<{match: Match, user: User}[]> {
    // Find all matches where the user is either user1 or user2
    const userMatches = await db.select()
      .from(matches)
      .where(
        sql`${matches.user1Id} = ${userId} OR ${matches.user2Id} = ${userId}`
      );
    
    // For each match, get the other user's info
    const result: {match: Match, user: User}[] = [];
    
    for (const match of userMatches) {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const user = await this.getUser(otherUserId);
      
      if (user) {
        result.push({
          match,
          user
        });
      }
    }
    
    return result;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages)
      .values({
        ...message,
        read: false,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async getMessages(matchId: number): Promise<Message[]> {
    const result = await db.select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);
    
    return result;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      )
    );
    
    return result[0]?.count || 0;
  }
}

// Create and export a singleton instance
export const dbStorage = new DbStorage();