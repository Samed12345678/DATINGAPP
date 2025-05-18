import { users, type User, type InsertUser, swipes, type Swipe, type InsertSwipe, matches, type Match, messages, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersForSwiping(userId: number): Promise<User[]>;
  
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
    
    return Array.from(this.users.values())
      .filter(user => user.id !== userId && !swipedUserIds.includes(user.id));
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
