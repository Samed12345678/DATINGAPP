import { db } from '../server/db';
import { users, swipes, matches, messages } from '../shared/schema';

async function main() {
  console.log('Creating database tables...');
  
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        bio TEXT,
        title TEXT,
        image TEXT NOT NULL,
        distance INTEGER,
        tags TEXT[],
        score TEXT NOT NULL DEFAULT '100',
        likes_received INTEGER NOT NULL DEFAULT 0,
        dislikes_received INTEGER NOT NULL DEFAULT 0,
        credits_remaining INTEGER NOT NULL DEFAULT 50,
        last_credit_reset TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Created users table');
    
    // Create swipes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS swipes (
        id SERIAL PRIMARY KEY,
        swiper_id INTEGER NOT NULL REFERENCES users(id),
        swiped_id INTEGER NOT NULL REFERENCES users(id),
        liked BOOLEAN NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Created swipes table');
    
    // Create matches table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id),
        user2_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Created matches table');
    
    // Create messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        match_id INTEGER NOT NULL REFERENCES matches(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Created messages table');
    
    // Add some sample data for testing
    await addSampleData();
    
    console.log('🎉 Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  }
}

async function addSampleData() {
  // Check if we already have users
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 0) {
    console.log('Sample data already exists, skipping...');
    return;
  }
  
  console.log('Adding sample data...');
  
  // Add sample users
  const sampleUsers = [
    {
      username: "elara",
      password: "password123",
      name: "Elara",
      age: 27,
      bio: "I craft arcane spells and solve ancient mysteries. Looking for a worthy challenger to match wits!",
      title: "Elven Sorceress",
      image: "https://images.unsplash.com/photo-1535324492437-d8dea70a38a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      distance: 2,
      tags: ["Magic", "Riddles", "Ancient Lore", "Spellcraft"],
      score: "120",
      likesReceived: 15,
      dislikesReceived: 2,
      creditsRemaining: 50,
      lastCreditReset: new Date()
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
      tags: ["Riddles", "Mining", "Crafting", "Ale"],
      score: "85",
      likesReceived: 7,
      dislikesReceived: 9,
      creditsRemaining: 50,
      lastCreditReset: new Date()
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
      tags: ["Divination", "Mysteries", "Stargazing", "Puzzles"],
      score: "110",
      likesReceived: 12,
      dislikesReceived: 3,
      creditsRemaining: 50,
      lastCreditReset: new Date()
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
      tags: ["Nature", "Tracking", "Wisdom", "Survival"],
      score: "95",
      likesReceived: 9,
      dislikesReceived: 5,
      creditsRemaining: 50,
      lastCreditReset: new Date()
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
      tags: ["Music", "Poetry", "Puzzles", "Enchantment"],
      score: "105",
      likesReceived: 11,
      dislikesReceived: 4,
      creditsRemaining: 50,
      lastCreditReset: new Date()
    }
  ];
  
  for (const user of sampleUsers) {
    await db.insert(users).values(user);
  }
  
  console.log('✅ Added sample users');
}

main().catch(console.error);