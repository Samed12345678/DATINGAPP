import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./db-storage"; // Use the database storage instead of memory storage
import { insertUserSchema, insertSwipeSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await dbStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Get a specific user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Create a new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await dbStorage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get users for swiping (excludes already swiped profiles)
  app.get("/api/users/:id/swipe", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profiles = await dbStorage.getUsersForSwiping(id);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profiles for swiping" });
    }
  });

  // Get user's remaining daily credits
  app.get("/api/users/:id/credits", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check and reset credits if needed
      await dbStorage.checkAndResetCreditsIfNeeded(id);
      
      // Get updated credits
      const credits = await dbStorage.getRemainingCredits(id);
      res.json({ credits });
    } catch (error) {
      res.status(500).json({ message: "Failed to get remaining credits" });
    }
  });

  // Create a swipe (left or right)
  app.post("/api/swipes", async (req, res) => {
    try {
      const swipeData = insertSwipeSchema.parse(req.body);
      
      // Check if users exist
      const swiper = await dbStorage.getUser(swipeData.swiperId);
      const swiped = await dbStorage.getUser(swipeData.swipedId);
      
      if (!swiper || !swiped) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough credits for a right swipe (only needed for likes)
      if (swipeData.liked) {
        const credits = await dbStorage.getRemainingCredits(swipeData.swiperId);
        
        if (credits <= 0) {
          return res.status(403).json({ 
            message: "Not enough credits to like a profile", 
            creditsRemaining: 0
          });
        }
        
        // Deduct a credit for the like
        await dbStorage.decrementCredits(swipeData.swiperId);
      }
      
      // Create the swipe
      const swipe = await dbStorage.createSwipe(swipeData);
      
      // Update the profile's popularity score
      if (swipeData.liked) {
        // Increase score when liked
        await dbStorage.incrementLikesReceived(swipeData.swipedId);
      } else {
        // Decrease score when disliked
        await dbStorage.incrementDislikesReceived(swipeData.swipedId);
      }
      
      // If it's a right swipe (like), check for a match
      if (swipeData.liked) {
        // Check if the other user has already liked this user
        const otherSwipe = await dbStorage.getSwipe(swipeData.swipedId, swipeData.swiperId);
        
        if (otherSwipe && otherSwipe.liked) {
          // It's a match! Create a match record
          const match = await dbStorage.createMatch(swipeData.swiperId, swipeData.swipedId);
          
          // Get updated remaining credits
          const creditsRemaining = await dbStorage.getRemainingCredits(swipeData.swiperId);
          
          return res.status(201).json({ 
            swipe, 
            isMatch: true,
            match,
            matchedUser: swiped,
            creditsRemaining
          });
        }
      }
      
      // Get updated remaining credits
      const creditsRemaining = await dbStorage.getRemainingCredits(swipeData.swiperId);
      
      // Return the swipe with no match
      res.status(201).json({ 
        swipe, 
        isMatch: false,
        creditsRemaining
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid swipe data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create swipe" });
    }
  });

  // Get matches for a user
  app.get("/api/users/:id/matches", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const matches = await dbStorage.getMatches(id);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get matches" });
    }
  });
  
  // Get a specific match with user info
  app.get("/api/matches/:id", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      // For simplicity, we're assuming the current user is user1 in the match
      // In a real app, this would be determined by the authenticated user
      const currentUserId = 1;
      
      const matches = await dbStorage.getMatches(currentUserId);
      const matchWithUser = matches.find(m => m.match.id === matchId);
      
      if (!matchWithUser) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(matchWithUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to get match details" });
    }
  });
  
  // Get messages for a match
  app.get("/api/matches/:id/messages", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }
      
      const messages = await dbStorage.getMessages(matchId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const { matchId, senderId, receiverId, content } = req.body;
      
      if (!matchId || !senderId || !receiverId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const message = await dbStorage.createMessage({
        matchId,
        senderId,
        receiverId,
        content
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Generate AI message suggestions 
  app.post("/api/messages/suggestions", async (req, res) => {
    try {
      const { recipientName, relationshipIntent } = req.body;
      
      if (!recipientName || !relationshipIntent) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if we have OpenAI API key available
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        // Return mock suggestions if API key is not available
        const mockSuggestions = getMockMessageSuggestions(recipientName, relationshipIntent);
        return res.json({ suggestions: mockSuggestions });
      }
      
      // If we have an API key, we would generate real suggestions with OpenAI
      // This would be implemented once the API key is provided
      const mockSuggestions = getMockMessageSuggestions(recipientName, relationshipIntent);
      res.json({ suggestions: mockSuggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate message suggestions" });
    }
  });

  // Helper function to generate suggestions based on relationship intent
  function getMockMessageSuggestions(recipientName: string, relationshipIntent: string) {
    const suggestions: Record<string, string[]> = {
      'long-term': [
        `Hi ${recipientName}, I noticed we share an interest in puzzles. What's your favorite type to solve?`,
        `Hello ${recipientName}! I'm looking for something meaningful. What are you hoping to find here?`,
        `${recipientName}, your profile really caught my attention. I'd love to get to know you better.`
      ],
      'casual': [
        `Hey ${recipientName}! How's your day going? Any fun plans for the weekend?`,
        `${recipientName}, your profile made me smile. What do you enjoy doing for fun?`,
        `Hi there ${recipientName}! No pressure, just wanted to say hello and see where things go.`
      ],
      'friendship': [
        `Hey ${recipientName}, I'm new in town and looking to make some friends. Would you be up for showing me around?`,
        `Hi ${recipientName}! I noticed we both enjoy similar activities. Would be great to hang out sometime!`,
        `${recipientName}, looking to expand my social circle. What kind of activities do you enjoy with friends?`
      ],
      'one-night': [
        `Hey ${recipientName}, I'm only in town for the night. Want to meet up for a drink?`,
        `${recipientName}, you're incredibly attractive. Any interest in meeting up tonight?`,
        `Direct and honest - I'm looking for something casual. If that's not your thing, no worries!`
      ]
    };
    
    return suggestions[relationshipIntent] || suggestions['casual'];
  }

  // Get unread message count for a user
  app.get("/api/users/:id/unread", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const count = await dbStorage.getUnreadMessageCount(id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to get unread message count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
