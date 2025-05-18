import { users, type User, type InsertUser, swipes, type Swipe, type InsertSwipe, matches, type Match, messages, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersForSwiping(userId: number): Promise<User[]>;
  
  // Credit system and scoring operations
  updateUserScore(userId: number, newScore: number): Promise<User>;
  incrementLikesReceived(userId: number): Promise<User>;
  incrementDislikesReceived(userId: number): Promise<User>;
  resetDailyCredits(userId: number, credits?: number): Promise<User>;
  checkAndResetCreditsIfNeeded(userId: number): Promise<User>;
  decrementCredits(userId: number): Promise<User>;
  getRemainingCredits(userId: number): Promise<number>;
  
  // Swipe operations
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  getSwipe(swiperId: number, swipedId: number): Promise<Swipe | undefined>;
  
  // Match operations
  createMatch(user1Id: number, user2Id: number): Promise<Match>;
  getMatches(userId: number): Promise<{match: Match, user: User}[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(matchId: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private swipes: Map<string, Swipe>;
  private matches: Map<number, Match>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentSwipeId: number;
  private currentMatchId: number;
  private currentMessageId: number;
  private DEFAULT_DAILY_CREDITS = 10;
  private SCORE_INCREASE_ON_LIKE = 2;
  private SCORE_DECREASE_ON_DISLIKE = 1;
  private MILLISEC_IN_DAY = 24 * 60 * 60 * 1000;

  constructor() {
    this.users = new Map();
    this.swipes = new Map();
    this.matches = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentSwipeId = 1;
    this.currentMatchId = 1;
    this.currentMessageId = 1;
    
    // Add mock users for the dating app
    this.addMockData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersForSwiping(userId: number): Promise<User[]> {
    // Get all users except the current user and already swiped users
    const swipedUserIds = Array.from(this.swipes.values())
      .filter(swipe => swipe.swiperId === userId)
      .map(swipe => swipe.swipedId);
    
    // Get eligible profiles (not swiped yet)
    const eligibleProfiles = Array.from(this.users.values())
      .filter(user => user.id !== userId && !swipedUserIds.includes(user.id));
    
    // Sort profiles by score (higher score comes first)
    // This creates a "popularity" ranking where more liked profiles appear first
    return eligibleProfiles.sort((a, b) => {
      // Parse score as number for proper comparison
      const scoreA = parseFloat(a.score as string);
      const scoreB = parseFloat(b.score as string);
      return scoreB - scoreA;
    });
  }
  
  // Credit system and scoring operations
  async updateUserScore(userId: number, newScore: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Update the user's score
    const updatedUser: User = {
      ...user,
      score: newScore.toString()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async incrementLikesReceived(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Increment likes received count
    const likesReceived = (user.likesReceived || 0) + 1;
    
    // Calculate new score based on likes and dislikes
    // Score increases more when user gets liked
    const currentScore = parseFloat(user.score as string);
    const newScore = currentScore + this.SCORE_INCREASE_ON_LIKE;
    
    // Update user with new values
    const updatedUser: User = {
      ...user,
      likesReceived,
      score: newScore.toString()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async incrementDislikesReceived(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Increment dislikes received count
    const dislikesReceived = (user.dislikesReceived || 0) + 1;
    
    // Calculate new score based on likes and dislikes
    // Score decreases less when user gets disliked
    const currentScore = parseFloat(user.score as string);
    const newScore = Math.max(currentScore - this.SCORE_DECREASE_ON_DISLIKE, 10); // Don't go below 10
    
    // Update user with new values
    const updatedUser: User = {
      ...user,
      dislikesReceived,
      score: newScore.toString()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async resetDailyCredits(userId: number, credits = this.DEFAULT_DAILY_CREDITS): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Reset credits and update timestamp
    const updatedUser: User = {
      ...user,
      creditsRemaining: credits,
      lastCreditReset: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async checkAndResetCreditsIfNeeded(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Check if we need to reset credits (it's been more than 24 hours)
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
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Ensure we've checked for daily reset before decrementing
    await this.checkAndResetCreditsIfNeeded(userId);
    
    // Get the latest user state after possible reset
    const updatedUser = await this.getUser(userId);
    
    // Decrement credits, don't go below 0
    const newCredits = Math.max((updatedUser?.creditsRemaining || 0) - 1, 0);
    
    const finalUser: User = {
      ...updatedUser!,
      creditsRemaining: newCredits
    };
    
    this.users.set(userId, finalUser);
    return finalUser;
  }
  
  async getRemainingCredits(userId: number): Promise<number> {
    // Check if we need to reset first
    const user = await this.checkAndResetCreditsIfNeeded(userId);
    return user.creditsRemaining || 0;
  }

  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    const id = this.currentSwipeId++;
    const newSwipe: Swipe = { 
      ...swipe, 
      id, 
      createdAt: new Date() 
    };
    
    // Use a composite key of swiperId-swipedId for the map
    const key = `${swipe.swiperId}-${swipe.swipedId}`;
    this.swipes.set(key, newSwipe);
    
    return newSwipe;
  }

  async getSwipe(swiperId: number, swipedId: number): Promise<Swipe | undefined> {
    const key = `${swiperId}-${swipedId}`;
    return this.swipes.get(key);
  }

  async createMatch(user1Id: number, user2Id: number): Promise<Match> {
    const id = this.currentMatchId++;
    const match: Match = {
      id,
      user1Id,
      user2Id,
      createdAt: new Date()
    };
    
    this.matches.set(id, match);
    return match;
  }

  async getMatches(userId: number): Promise<{match: Match, user: User}[]> {
    const userMatches = Array.from(this.matches.values())
      .filter(match => match.user1Id === userId || match.user2Id === userId);
    
    return Promise.all(userMatches.map(async match => {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const user = await this.getUser(otherUserId);
      return {
        match,
        user: user!
      };
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const newMessage: Message = {
      ...message,
      id,
      read: false,
      createdAt: new Date()
    };
    
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessages(matchId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.matchId === matchId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.read)
      .length;
  }

  private addMockData() {
    const mockUsers: InsertUser[] = [
      {
        username: "elara",
        password: "password123",
        name: "Elara",
        age: 27,
        bio: "I craft arcane spells and solve ancient mysteries. Looking for a worthy challenger to match wits!",
        title: "Elven Sorceress",
        image: "https://images.unsplash.com/photo-1535324492437-d8dea70a38a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 2,
        tags: ["Magic", "Riddles", "Ancient Lore", "Spellcraft"]
      },
      {
        username: "thorne",
        password: "password123",
        name: "Thorne",
        age: 32,
        bio: "Master of stone and metal, crafter of the most complex riddles. Can you solve my puzzles?",
        title: "Dwarven Riddlemaster",
        image: "https://images.unsplash.com/photo-1560173045-beaf11c65dce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 5,
        tags: ["Riddles", "Mining", "Crafting", "Ale"]
      },
      {
        username: "orianna",
        password: "password123",
        name: "Orianna",
        age: 24,
        bio: "I see beyond the veil of time. Let's unravel the mysteries of the universe together.",
        title: "Mystic Oracle",
        image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 3,
        tags: ["Divination", "Mysteries", "Stargazing", "Puzzles"]
      },
      {
        username: "garrick",
        password: "password123",
        name: "Garrick",
        age: 30,
        bio: "Guardian of the ancient forests, protector of sacred riddles. Test your wisdom against nature's challenges.",
        title: "Forest Sentinel",
        image: "https://images.unsplash.com/photo-1610228064197-71477e3b6e08?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 10,
        tags: ["Nature", "Tracking", "Wisdom", "Survival"]
      },
      {
        username: "lyra",
        password: "password123",
        name: "Lyra",
        age: 26,
        bio: "My melodies enchant and my riddles challenge. Let's create harmony through puzzles and music.",
        title: "Melodic Enigmatist",
        image: "https://images.unsplash.com/photo-1557296387-5358ad7997bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 7,
        tags: ["Music", "Poetry", "Puzzles", "Enchantment"]
      },
      {
        username: "voltar",
        password: "password123",
        name: "Voltar",
        age: 35,
        bio: "Master of elemental fire and logic puzzles. Can you withstand the heat of my challenges?",
        title: "Flame Wizard",
        image: "https://images.unsplash.com/photo-1618077360466-f4cc5be24fe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 15,
        tags: ["Fire Magic", "Logic", "Elements", "Strategy"]
      },
      {
        username: "selene",
        password: "password123",
        name: "Selene",
        age: 29,
        bio: "Priestess of the moon, keeper of celestial puzzles. Navigate the night's mysteries with me.",
        title: "Lunar Priestess",
        image: "https://images.unsplash.com/photo-1563620434840-30561bedd697?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 8,
        tags: ["Astronomy", "Rituals", "Moon Magic", "Mysteries"]
      },
      {
        username: "draven",
        password: "password123",
        name: "Draven",
        age: 31,
        bio: "Knight of the realm, defender of truth. My sword is sharp, but my mind is sharper.",
        title: "Noble Knight",
        image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        distance: 12,
        tags: ["Combat", "Honor", "Strategy", "Chivalry"]
      }
    ];

    mockUsers.forEach(user => {
      const id = this.currentUserId++;
      this.users.set(id, { ...user, id });
    });
  }
}

export const storage = new MemStorage();
